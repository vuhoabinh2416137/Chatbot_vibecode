require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// System prompt chuyên sâu cho Gia sư Toán 12
const SYSTEM_INSTRUCTION_BASE = `
Bạn là "Trợ lý Gia sư AI Chuyên Toán Lớp 12" - một chuyên gia toán học tận tâm, giàu kinh nghiệm luyện thi tốt nghiệp THPT Quốc gia môn Toán theo chương trình giáo dục phổ thông Việt Nam (cả sách giáo khoa mới Kết nối tri thức, Cánh diều, Chân trời sáng tạo).

NHIỆM VỤ CỦA BẠN:
1. Hỗ trợ học sinh giải đáp thắc mắc, phân tích phương pháp và hướng dẫn giải chi tiết các chủ đề Toán 12:
   - Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số (Đơn điệu, cực trị, GTLN-GTNN, tiệm cận, bảng biến thiên, tương giao).
   - Nguyên hàm, Tích phân và Ứng dụng (Diện tích hình phẳng, thể tích khối tròn xoay).
   - Hình học không gian & Phương pháp tọa độ trong không gian Oxyz (Vectơ, mặt phẳng, đường thẳng, mặt cầu).
   - Số phức và các bài toán cực trị số phức (nếu liên quan).
   - Thống kê & Xác suất có điều kiện.
   - Các bài toán thực tế tối ưu hóa (kinh tế, vật lý, hình học).

QUY TẮC BẮT BUỘC VỀ TRÌNH BÀY TOÁN HỌC:
1. TẤT CẢ công thức, ký hiệu toán học, biểu thức, biến số PHẢI được viết bằng mã LaTeX chuẩn:
   - Ký hiệu nội dòng (inline math): kẹp giữa duy nhất 1 dấu $ (ví dụ: $f(x) = x^3 - 3x$, $\\int_0^1 x dx$, $\\vec{u} = (1; 2; -1)$).
   - Ký hiệu dạng khối (display math / công thức quan trọng đứng riêng dòng): kẹp giữa 2 dấu $$ (ví dụ: $$\\lim_{x \\to +\\infty} \\frac{2x+1}{x-1} = 2$$).
   - KHÔNG dùng dấu ngoặc vuông \\[ \\] hay \\( \\) thay cho $ hoặc $$.

CẤU TRÚC PHẢN HỒI CHUẨN MỰC:
Khi giải một bài toán, hãy cấu trúc bài trả lời rõ ràng, dễ theo dõi:
1. 🎯 **Dạng toán & Hướng tư duy**: Nêu ngắn gọn bài toán thuộc dạng nào và công thức mấu chốt.
2. 📝 **Lời giải chi tiết từng bước**: Trình bày mạch lạc, giải thích rõ lý do tại sao biến đổi như vậy.
3. 💡 **Mẹo trắc nghiệm / Bấm máy tính Casio**: Nếu bài toán có thể bấm máy (fx-580VN X hoặc 880BTG) hoặc có mẹo loại trừ đáp án nhanh, hãy hướng dẫn cụ thể phím bấm (ví dụ: Menu 8 - Table, Menu 9 - Phương trình, phím CALC, v.v.).
4. ⚠️ **Lưu ý & Bẫy sai lầm**: Chỉ ra những lỗi học sinh hay nhầm lẫn (ví dụ: quên điều kiện xác định, nhầm lẫn giữa tiệm cận đứng và tiệm cận ngang, quên cộng hằng số C khi tính nguyên hàm, v.v.).

PHONG CÁCH SƯ PHẠM:
- Nhiệt tình, khích lệ, thân thiện nhưng khoa học, chuẩn xác tuyệt đối về mặt toán học.
- Nếu người dùng tải lên ảnh bài tập, hãy đọc kĩ đề bài trong ảnh, chép lại đề toán bằng LaTeX trước khi giải.
`;

const MODE_PROMPTS = {
  full: `Chế độ: GIẢI CHI TIẾT ĐẦY ĐỦ. Hãy cung cấp phương pháp, các bước biến đổi chi tiết, kết luận, mẹo Casio (nếu có) và bẫy trắc nghiệm.`,
  hint: `Chế độ: GỢI Ý PHƯƠNG PHÁP (Socratic). ĐỪNG vội đưa ngay đáp án cuối cùng! Hãy phân tích giả thiết, nhắc lại công thức liên quan và đặt câu hỏi gợi mở từng bước để học sinh tự làm.`,
  casio: `Chế độ: MẸO BẤM MÁY TÍNH CASIO (fx-580VN X / 880BTG). Tập trung tối đa vào các thao tác bấm máy: chức năng Menu nào, nhập biểu thức ra sao, chọn Start/End/Step thế nào, hoặc dùng đạo hàm d/dx, CALC thử nghiệm đáp án.`
};

// Hàm lấy danh sách models khả dụng từ Google Gemini API
async function getAvailableModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) return [];
    return data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
  } catch (e) {
    console.error('Lỗi khi lấy danh sách model:', e.message);
    return [];
  }
}

// API Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasServerApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5),
    defaultModel: 'gemini-2.5-flash',
    supportedModels: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash', 'gemini-2.5-pro']
  });
});

// API Lấy danh sách models
app.get('/api/models', async (req, res) => {
  const apiKey = (
    req.headers['x-api-key'] ||
    req.query.apiKey ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return res.json({ models: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash', 'gemini-2.5-pro'] });
  }

  const models = await getAvailableModels(apiKey);
  return res.json({ models: models.length > 0 ? models : ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash'] });
});

// Helper thực hiện gọi Gemini API generateContent
async function callGeminiGenerate(modelName, apiKey, requestBody) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  return await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
}

// API Chat
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      image = null,
      model = 'gemini-3.6-flash',
      mode = 'full',
      customApiKey = null
    } = req.body;

    // Lấy API key từ header, body hoặc file .env
    const apiKey = (
      req.headers['x-api-key'] ||
      customApiKey ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return res.status(401).json({
        error: 'Chưa có Gemini API Key. Bạn có thể lấy API Key miễn phí tại Google AI Studio (https://aistudio.google.com/) và nhập vào mục "Cài đặt" hoặc cấu hình trong file .env!'
      });
    }

    if (!message && !image) {
      return res.status(400).json({ error: 'Nội dung câu hỏi hoặc hình ảnh không được để trống.' });
    }

    // Ghép System Instruction
    const systemInstructionText = `${SYSTEM_INSTRUCTION_BASE}\n\n${MODE_PROMPTS[mode] || MODE_PROMPTS.full}`;

    // Xây dựng contents cho Gemini API
    const contents = [];

    // Thêm lịch sử hội thoại trước đó (nếu có)
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item.content) continue;
        const role = item.role === 'user' ? 'user' : 'model';
        contents.push({
          role: role,
          parts: [{ text: item.content }]
        });
      }
    }

    // Phần tin nhắn hiện tại của người dùng
    const currentParts = [];

    // Nếu có ảnh bài tập (base64)
    if (image && typeof image === 'string') {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    // Thêm phần text
    if (message && message.trim()) {
      currentParts.push({ text: message.trim() });
    } else if (image) {
      currentParts.push({ text: 'Hãy nhận diện đề bài toán lớp 12 trong hình ảnh này và hướng dẫn giải chi tiết.' });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    let targetModel = model && model !== 'auto' ? model : 'gemini-2.5-flash';

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.2, // Nhiệt độ thấp để giải toán chính xác logic
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };

    let response = await callGeminiGenerate(targetModel, apiKey, requestBody);

    // Nếu model bị deprecated hoặc not found, tự động truy vấn ModelService.ListModels và chọn model khả dụng
    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = {};
      try { parsedErr = JSON.parse(errText); } catch (e) { parsedErr = { error: { message: errText } }; }
      const errMsg = parsedErr?.error?.message || errText;

      const isModelUnavailable =
        response.status === 404 ||
        errMsg.includes('not found') ||
        errMsg.includes('no longer available') ||
        errMsg.includes('ListModels');

      if (isModelUnavailable) {
        console.log(`Model ${targetModel} không khả dụng (${errMsg}). Đang tìm kiếm model thay thế khả dụng...`);
        const availableModels = await getAvailableModels(apiKey);
        console.log('Danh sách model khả dụng từ Google:', availableModels);

        if (availableModels.length > 0) {
          // Ưu tiên: gemini-3.6-flash -> gemini-2.5-flash -> bất kỳ model flash nào -> model gemini đầu tiên
          const fallbackModel =
            availableModels.find(m => m === 'gemini-3.6-flash') ||
            availableModels.find(m => m.includes('3.6') && m.includes('flash')) ||
            availableModels.find(m => m.includes('2.5') && m.includes('flash')) ||
            availableModels.find(m => m.includes('flash')) ||
            availableModels.find(m => m.startsWith('gemini')) ||
            availableModels[0];

          if (fallbackModel && fallbackModel !== targetModel) {
            console.log(`Đang tự động chuyển sang model khả dụng: ${fallbackModel}`);
            targetModel = fallbackModel;
            response = await callGeminiGenerate(targetModel, apiKey, requestBody);
          }
        }
      }

      // Nếu sau khi fallback vẫn không ok
      if (!response.ok) {
        const retryErrText = await response.text();
        let retryParsed = {};
        try { retryParsed = JSON.parse(retryErrText); } catch (e) { retryParsed = { error: { message: retryErrText } }; }
        const finalErrMsg = retryParsed?.error?.message || retryErrText;

        if (response.status === 400 && finalErrMsg.includes('API_KEY_INVALID')) {
          return res.status(400).json({
            error: 'API Key không hợp lệ. Vui lòng kiểm tra lại Google Gemini API Key của bạn.'
          });
        }

        if (response.status === 429) {
          return res.status(429).json({
            error: 'Đã vượt quá giới hạn lượt gọi miễn phí trong phút (Rate Limit). Vui lòng đợi khoảng 15-30 giây rồi thử lại.'
          });
        }

        return res.status(response.status).json({
          error: `Lỗi từ Gemini API: ${finalErrMsg}`
        });
      }
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const botReply = candidate?.content?.parts?.map(p => p.text).join('') || 'Không có phản hồi.';

    return res.json({
      text: botReply,
      modelUsed: targetModel,
      finishReason: candidate?.finishReason || 'STOP'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: `Lỗi máy chủ nội bộ: ${error.message}`
    });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Chatbot Toán 12 đang chạy tại: http://localhost:${PORT}`);
  console.log(`📚 Hệ thống sẵn sàng phục vụ học sinh lớp 12!`);
  console.log(`====================================================`);
});
