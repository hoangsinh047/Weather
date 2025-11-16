# Weather App — Hướng dẫn chạy & triển khai

Tôi đã kiểm tra và build dự án `Weather` thành công. Dưới đây là hướng dẫn nhanh để chạy local và nhiều phương án deploy cùng cách đặt `VITE_OPENWEATHER_KEY`.

## Trạng thái hiện tại
- `npm run build` thành công và sinh `dist/` (sẵn để deploy).
- Tôi đã chỉnh sửa formatter nhiệt độ để tránh hiển thị `NaN` trong `WeatherCard` và `ForecastList`.
- Ứng dụng frontend hiện hiển thị dữ liệu fallback từ `/weather` + `/forecast` khi One Call API trả 401.

## Nguyên nhân và lưu ý về API key (401)
- Nếu curl đến endpoint geocoding (`/geo/1.0/direct`) trả kết quả với cùng key nhưng gọi `data/2.5/onecall` (One Call) trả 401, có khả năng:
  1. Key chưa có quyền truy cập One Call (One Call 3.0 yêu cầu gói trả phí hoặc khác so với miễn phí).
  2. OpenWeather thay đổi chính sách/endpoint cho One Call (kiểm tra dashboard OpenWeather và FAQ).
  3. Key bị hạn chế domain/IP (hiếm gặp với yêu cầu từ trình duyệt nhưng có thể có).
- Ứng dụng hiện có cơ chế fallback: nếu One Call trả 401 thì sẽ dùng `/weather` và `/forecast` thay thế — đó là lý do bạn thấy curl cho một số endpoint OK nhưng giao diện vẫn cảnh báo 401.

Lời khuyên: vào https://home.openweathermap.org/api_keys để kiểm tra trạng thái API key, các hạn chế, và các gói API bạn đang dùng.

## Chạy cục bộ (dev)
1. Tạo file `.env` trong thư mục `Weather` (không commit file này):

```
VITE_OPENWEATHER_KEY=PASTE_YOUR_KEY_HERE
```

2. Chạy dev (Windows cmd):

```cmd
cd Weather
npm install
npm run dev
```

Lưu ý: nếu bạn chạy trong PowerShell, dùng `cmd /c "npm run dev"` hoặc chạy trực tiếp `npm run dev` trong PowerShell — Vite sẽ đọc biến `VITE_*` từ `.env`.

## Cách deploy (tóm tắt & bước cụ thể)
Lưu ý quan trọng: biến môi trường `VITE_OPENWEATHER_KEY` phải có giá trị *tại thời điểm build* cho frontend (nếu bạn build rồi upload static files). Biến này sẽ được nhúng vào bundle và có thể bị lộ cho người dùng (không an toàn nếu bạn muốn giữ key riêng). Nếu muốn giữ key bí mật, cần một backend proxy và thiết lập `VITE_BACKEND_URL` để frontend gọi backend.

1) Vercel (rất dễ với repo GitHub)
- Connect repo -> Project Settings -> Root directory: `Weather` (nếu repo chứa nhiều project).
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: thêm `VITE_OPENWEATHER_KEY` với giá trị key của bạn (Project > Settings > Environment Variables)
- Deploy. Nếu muốn ẩn key: triển khai một backend (ví dụ Express) và set `VITE_BACKEND_URL` để frontend gọi backend.

2) Netlify
- Create new site from Git -> chọn repo -> trong Build settings đặt:
  - Build command: `npm run build`
  - Publish directory: `dist`
- Trong Site settings -> Build & deploy -> Environment -> Edit variables: thêm `VITE_OPENWEATHER_KEY`.
- Deploy.

3) GitHub Pages (static)
- Cách nhanh: build local: `cd Weather && npm run build` rồi push nội dung `dist/` lên nhánh `gh-pages` (bạn có thể dùng `gh-pages` package hoặc workflow GitHub Actions):
  - Option A (local):
    - `npm run build`
    - `npx gh-pages -d dist` (cần thêm `gh-pages` package vào `devDependencies` nếu muốn dùng)
  - Option B (Actions): tạo workflow để build & deploy `dist` lên `gh-pages` branch. Trong workflow, set secret `VITE_OPENWEATHER_KEY` and export it before build.
- Lưu ý: key vẫn sẽ được nhúng vào bundle.

4) Amazon S3 + CloudFront
- Build local.
- Upload `dist/` files vào S3 bucket (public or via CloudFront).
- (Tùy chọn) Tạo CloudFront distribution trỏ tới S3, bật HTTPS.
- Nếu có CI/CD, set `VITE_OPENWEATHER_KEY` trong pipeline môi trường trước khi build.

5) VPS / Nginx
- Trên máy chủ: cài Node/npm.
- Clone repo, `cd Weather`, tạo `.env.production` hoặc set env trước khi chạy build.
- `npm ci && npm run build`
- Cấu hình Nginx để serve `dist/` như static files.
- Nếu muốn key an toàn, xây backend trên VPS (Express, Spring, v.v.) và chỉ publish frontend với `VITE_BACKEND_URL` pointing to backend.

## Bảo mật key & đề xuất tốt nhất
- Không lưu OpenWeather API key bí mật trong bundle client nếu bạn muốn giữ key riêng tư — bất kỳ biến `VITE_*` nào cũng sẽ được đóng gói và có thể xem trong mã nguồn frontend.
- Giải pháp an toàn: triển khai một nhỏ backend (serverless function hoặc express) làm proxy, backend giữ API key (không public). Frontend gọi `/api/weather?lat=...&lon=...` ở domain backend. Tôi có thể giúp bạn viết proxy nhỏ (Node/Express) nếu bạn muốn — nói tôi biết môi trường bạn muốn (Vercel Serverless, Heroku, VPS…)

## Kiểm tra nhanh sau deploy
- Kiểm tra console trình duyệt để xem nếu có 401 từ One Call: nếu có, app sẽ fallback sang `/weather` + `/forecast` (như hiện tại).
- Nếu nhiệt độ hiển `—` là dấu app không tìm được giá trị số; chúng ta đã cải thiện formatter để tránh NaN.

## Những thay đổi tôi đã thực hiện (tóm tắt)
- Sửa `src/components/WeatherCard.jsx` — formatter temp an toàn (hỗ trợ object/day và numeric string).
- Sửa `src/components/ForecastList.jsx` — formatter temp an toàn.
- Build project và xác nhận `dist/` được tạo.

---
Nếu bạn muốn, tôi có thể tiếp tục bằng một trong các bước sau (chọn 1):
- Triển khai nhanh lên Vercel cho bạn (cần quyền truy cập repo hoặc bạn làm theo hướng dẫn tôi đưa). 
- Tạo proxy backend Node/Express mẫu và hướng dẫn deploy (đóng API key ở server).
- Viết GitHub Actions workflow để tự động build & deploy lên GitHub Pages/Netlify.

Chọn hướng bạn muốn tôi thực hiện tiếp hoặc cho biết nền tảng deploy bạn ưu tiên (Vercel / Netlify / GitHub Pages / S3 / VPS).
