# Weather App (Front-end)

Ứng dụng giao diện React (Vite) hiển thị thông tin thời tiết đẹp mắt.

Tính năng
- Tìm kiếm theo tên thành phố (sử dụng OpenWeather Geocoding + One Call)
- Hiển thị thời tiết hiện tại và dự báo 7 ngày
- Giao diện responsive và hiện đại (CSS custom)

Chuẩn bị
1. Cài Node.js (>=16) và npm
2. Tạo file `.env` ở thư mục gốc với biến:

VITE_OPENWEATHER_KEY=your_openweather_api_key_here

Chạy project

```bash
cd E:/Project/Weather
npm install
npm run dev
```

Ghi chú
- Backend Spring sẽ được triển khai sau; hiện tại frontend gọi trực tiếp OpenWeather.
- Nếu muốn proxy API qua backend, bạn có thể thay đổi `src/utils/api.js` để gọi endpoint của backend.

Liên hệ
- Tài liệu OpenWeather: https://openweathermap.org/api

