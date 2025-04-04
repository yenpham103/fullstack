# Next.JS Render Client Component + Server Component như thế nào?

docs: https://nextjs.org/docs/app/building-your-application/rendering/client-components#how-are-client-components-rendered

> Tài liệu được viết tay bởi [Đức Hậu](https://github.com/duchaunee), để giúp bạn có thêm hiểu biết và làm chủ về NextJS.

# Mục lục

[I. TRANG HOÀN TOÀN LÀ CLIENT COMPONENT](#i-trang-hoàn-toàn-là-client-component)
- [1. Full page load](#1-full-page-load-lần-đầu-truy-cập-vào-ứng-dụng-của-bạn-hoặc-tải-lại-trang-được-kích-hoạt-bởi-việc-refresh-trình-duyệt)
	+ [1.1. Luồng chạy](#11-luồng-chạy)
	+ [1.2. Lưu ý](#12-lưu-ý)
- [2. Subsequent Navigations - Đọc phần 4](#2-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi-đọc-phần-iv)

[II. TRANG HOÀN TOÀN LÀ SERVER COMPONENT](#ii-trang-hoàn-toàn-là-server-component)
- [1. Full page load](#1-full-page-load-lần-đầu-truy-cập-vào-ứng-dụng-của-bạn-hoặc-tải-lại-trang-được-kích-hoạt-bởi-việc-refresh-trình-duyệt-1)
	+ [1.1. Luồng chạy](#11-luồng-chạy-1)
	+ [1.2. Lưu ý](#12-lưu-ý-1)
- [2. Subsequent Navigations - Đọc phần 4](#2-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi-đọc-phần-iv-1)

[III. NẾU 1 TRANG MÀ CÓ XEN KẼ CLIENT COMPONENT + SERVER COMPONENT THÌ RENDER NHƯ NÀO ?](#iii-nếu-1-trang-mà-có-xen-kẽ-client-component--server-component-thì-render-như-nào-)
- [1. Full page load](#1-full-page-load-lần-đầu-truy-cập-vào-ứng-dụng-của-bạn-hoặc-tải-lại-trang-được-kích-hoạt-bởi-việc-refresh-trình-duyệt-2)
- [2. Subsequent Navigations - Đọc phần 4](#2-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi-đọc-phần-iv-2)

[IV. Subsequent Navigations: TỪ LẦN ĐIỀU HƯỚNG THỨ 2 TRỞ ĐI](#iv-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi)

[IV. RSC Payload](#rsc-payload)

- Trong Next.js, các `Components` được render khác nhau tùy thuộc vào việc yêu cầu là một phần của `full page load` (lần đầu truy cập vào ứng dụng của bạn hoặc tải lại trang được kích hoạt bởi việc refresh trình duyệt) hay là `Subsequent navigation` (từ lần điều hướng thứ 2 trở đi)

# I. TRANG HOÀN TOÀN LÀ CLIENT COMPONENT

## 1. Full page load: `Lần đầu truy cập vào ứng dụng của bạn hoặc tải lại trang được kích hoạt bởi việc refresh trình duyệt`
> Tóm tắt đơn giản là ở lần full page load, Next.JS sẽ render trước HTML (render tĩnh thui) của Client component trên server (lúc này cái Client component đó sẽ ở môi trường server), sau đó trả về cho client đống HTML đó + đống JS Bundle download (lúc này cái Client component đó sẽ ở môi trường client/browser) và hiển thị giao diện lun (nhưng lúc này chưa có tương tác). Cuối cùng là sẽ thêm các sự kiện vào các Client component để tương tác với người dùng => Bước này gọi là Hydration, sau bước này thì có thể tương tác với website

### ***1.1. Luồng chạy***: 
- `On the server`: Lúc này client component đang ở `môi trường server`
	+ _1_. React render các Server Components thành một định dạng dữ liệu đặc biệt được gọi là React Server Component Payload (RSC Payload), bao gồm các tham chiếu đến Client Components.
	+ _2_. Next.js sử dụng RSC Payload và các hướng dẫn JavaScript của Client Component để render HTML cho route trên server.
	
		> Hiểu đơn giản là Next.JS sẽ render trước HTML của client component trên server
		
- `Then, on the client`: Lúc này client component đang ở `môi trường client/browser`
	+ _1_. HTML được sử dụng để hiển thị ngay lập tức một bản xem trước, Client ngay lập tức thấy được website nhưng chưa tương tác được với nó (ví dụ chưa click, hover,...)
	+ _2_. Trong đống JS Bundle download về có chứa RSC Payload, được dùng để để render lại client component ở client, cập nhật DOM
	+ _3_. Cuối cùng là sẽ thêm các sự kiện vào các client component để tương tác với người dùng => Bước này gọi là Hydration, sau bước này thì có thể tương tác với website

### ***1.2. Lưu ý:***
- Thử `console.log()` ở Client component, thì thấy do là `full page load`, Client component được render trước HTML trên server, nên nếu log ở `Client component` thì cũng thấy nó in ra trong terminal (môi trường server), ***nhưng từ lần điều hướng thứ 2 trở đi, server chỉ trả về RSC Payload chứ không fetch trước trên server nữa, nên sẽ không thấy log của Client component trên terminal nữa đâu nhá***

- Check tab NetWork thì thấy response nó trả về HTML, chứng tỏ ở `full page load` thì ***Client component*** sẽ được server NextJS sẽ render trước HTML và trả về cho client `(sau đó về client sẽ thực hiện hydration...)`, điều này chỉ đúng ở lần request đầu `(full page load)` thôi, do từ lần điều hướng thứ 2 trở đi, nó chỉ trả về RSC Payload chứ không render HTML trước trên server nữa, đọc `PHẦN 4` sẽ rõ

	
## 2. Subsequent Navigations: `Từ lần điều hướng thứ 2 trở đi`, đọc [PHẦN IV](#iv-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi)

+--------------------+--------------------+--------------------+--------------------+

# II. TRANG HOÀN TOÀN LÀ SERVER COMPONENT

## 1. Full page load: `Lần đầu truy cập vào ứng dụng của bạn hoặc tải lại trang được kích hoạt bởi việc refresh trình duyệt`
> Tóm tắt đơn giản là ở lần full page load, Next.JS sẽ render (render full trang lun :>) Server component trên server, sau đó trả về HTML đó cho client để hiển thị giao diện và dùng RSC Payload để cập nhật DOM và đảm bảo rằng cấu trúc cuối cùng của trang khớp với kết quả render từ server. 

### ***1.1. Luồng chạy***: 
- `Render hoàn toàn trên Server và trả về Client`:
	+ _1_. React render Server Components thành một định dạng dữ liệu đặc biệt được gọi là React Server Component Payload (RSC Payload)
	+ _2_. Next.js sử dụng `RSC Payload` và `Client Component JavaScript instructions` để render HTML for the route trên máy chủ.
	+ _3_. RSC Payload + HTML sẽ được gửi đến client
	+ _4_. HTML được sử dụng để hiển thị, trong khi RSC Payload được sử dụng để cập nhật DOM và đảm bảo rằng cấu trúc cuối cùng của trang khớp với kết quả render từ server.

### ***1.2. Lưu ý:***	
- Thử `console.log()` ở Server component, do là server component nên dù ở lần `ĐIỀU HƯỚNG LẦN THỨ BAO NHIÊU ĐI CHĂNG NỮA` (full page load hay từ lần 2 trở đi), nó vẫn log bên trong terminal thôi.

- Check tab NetWork thì thấy response nó trả về HTML, chứng tỏ ở `full page load` thì ***Server component*** sẽ được server NextJS sẽ render trước HTML và trả về cho client, điều này chỉ đúng ở lần request đầu `(full page load)` thôi, do từ lần điều hướng thứ 2 trở đi, nó chỉ trả về RSC Payload chứ không fetch trước trên server nữa, đọc `PHẦN 4` sẽ rõ


## 2. Subsequent Navigations: `Từ lần điều hướng thứ 2 trở đi`, đọc [PHẦN IV](#iv-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi)

+--------------------+--------------------+--------------------+--------------------+

# III. NẾU 1 TRANG MÀ CÓ XEN KẼ CLIENT COMPONENT + SERVER COMPONENT THÌ RENDER NHƯ NÀO ?
***ĐỂ DỄ HÌNH DUNG THÌ CỨ COI NHƯ CLIENT COMPONENT NÓ RENDER THEO KIỂU CLIENT COMPONENT [PHẦN I](#i-trang-hoàn-toàn-là-client-component), SERVER COMPONENT NÓ RENDER THEO KIỂU SERVER COMPONENT [PHẦN II](#ii-trang-hoàn-toàn-là-server-component)***

***KHÔNG CẦN ĐỌC CŨNG ĐƯỢC, MÀ ĐỌC CHO BIẾT THÊM THÔNG TIN CŨNG ĐƯỢC***

## 1. Full page load: `Lần đầu truy cập vào ứng dụng của bạn hoặc tải lại trang được kích hoạt bởi việc refresh trình duyệt`

### Full page load thì cả client component + server component đều sẽ render trước trên server và trả về HTML

- ***Trên server***
	+ Server Components được render trước. Chúng tạo ra RSC Payload
	+ Khi gặp một Client Component, server sẽ:
		> Không render nội dung của Client Component.
		
		> Thay vào đó, nó sẽ chèn một "placeholder" (phần giữ chỗ) vào vị trí của Client Component trong RSC Payload. "Placeholder" này chỉ là một comment HTML đơn giản đánh dấu vị trí của Client Component.
		
		> Đồng thời, nó chuẩn bị JavaScript instructions cho Client Component này. JavaScript instructions này chứa thông tin cần thiết để render Client Component trên client, bao gồm code của Component, props, và state.
	+ Server tiếp tục render các Server Components còn lại
	+ Cuối cùng, server tạo ra HTML ban đầu dựa trên RSC Payload, HTML này sẽ chứa HTML của các Server Component, các placeholder của Client Component, và một số JavaScript bundle cần thiết cho hydration.

- ***Trên client***
	+ Browser nhận HTML (HTML của Server component) và hiển thị ngay lập tức, tạo ra bản preview nhanh của trang. Lúc này, các Server Component sẽ được hiển thị, nhưng các Client Component chỉ là placeholder trống
	+ Browser nhận RSC Payload và JavaScript instructions
		> Nó sử dụng RSC Payload để cập nhật DOM cho các Server Components
		
		> Khi gặp placeholder của Client Component, nó sẽ render Client Component đó bằng cách sử dụng JavaScript instructions.
	+ Các Client Components được hydrate, làm cho chúng có khả năng tương tác.

-  Trình tự hiển thị như sau: 
1. ***Server Component***: Server Component được render và hiển thị ngay lập tức.
2. ***Placeholder***: Trình duyệt hiển thị placeholder cho các Client Component.
3. ***Hydration***: Client Component được hydrate và hiển thị, thay thế placeholder.

## 2. Subsequent Navigations: `Từ lần điều hướng thứ 2 trở đi`, đọc [PHẦN IV](#iv-subsequent-navigations-từ-lần-điều-hướng-thứ-2-trở-đi)

+--------------------+--------------------+--------------------+--------------------+

# IV. Subsequent Navigations: TỪ LẦN ĐIỀU HƯỚNG THỨ 2 TRỞ ĐI
### Đúng cho TẤT CẢ CÁC TRƯỜNG HỢP trang `chỉ là Client component` hoặc `chỉ là Server component` hoặc `xen kẽ cả Client component + Server component`

> Tóm tắt đơn giản là từ lần điều hướng thứ 2 trở đi (Subsequent Navigations), kể cả `Client component`,`Server component` hay `Client component xen kẽ Server component` thì server Next.js sẽ không trả HTML về cho chúng ta nữa mà chỉ fetch RSC Payload và các bundle JS, CSS cần thiết cho route mới ***check tab network sẽ thấy nó fetch về nhá***, RSC Payload nó để cập nhật lại DOM đó, đọc bên dưới nhé :>

Ví dụ chúng ta navigate từ /home sang /about

- Mở tab `Network` sẽ thấy nó không trả về HTML cho mình nữa mà nó call 1 api tên là `about?_rsc=xyz` trong đó `about là tên của Component`, xyz chắc là cái gì đó nhận biết của RSC Payload, check `tab Response sẽ thấy data của RSC Payload`

- Thử `console.log()` ở cả `Client component + Server component` thì thấy:
	+ ***Đối với Client component***: Lúc này nó hoàn toàn ở môi trường client/browser `(không ở trên môi trường server như PHẦN 1 nữa)` mở terminal không thấy log của client component được in ra, chứng tỏ lúc này Next.JS không render trước HTML như `full page load` nữa
	+  ***Đối với Server component***: Do là server component nên dù ở lần `REQUEST THỬ BAO NHIÊU ĐI CHĂNG NỮA`, nó vẫn log bên trong terminal. 

> Chứng tỏ rằng lúc này `Khi request lần thứ 2 trở đi`, kể cả `Client component` và `Server component` thì server Next.js sẽ không trả HTML về cho chúng ta nữa mà chỉ fetch RSC Payload và các bundle JS, CSS cần thiết cho route mới ***check tab network sẽ thấy nó fetch về nhá***

- React sẽ sử dụng RSC Payload để đối chiếu cây Component của Client và Server, và cập nhật DOM.
	+ Các Server Components được cập nhật dựa trên dữ liệu mới
	+ Các Client Components hiện có được giữ nguyên nếu chúng không thay đổi, nhưng nếu route mới có các Client Components chưa được load trước đó, JavaScript cho các components này sẽ được tải và hydrate để gắn các event
	
- Điều này sẽ giúp việc navigation nhanh hơn, nhưng vẫn đảm bảo về SEO

[LƯU Ý]:
- `Server Components`: Luôn được render trên server và gửi xuống qua RSC Payload.
- `Client Components`: Có thể được tái sử dụng nếu đã load trước đó, chỉ fetch và hydrate các components mới.
	+ Tức là nếu nó navigate từ /home sang /about mà Client Component `<Header />` xuất hiện ở cả trang Home và About, thì nếu ở /home mà `lần đầu` tải `<Header />` rồi (tức là trước đó chưa có route nào tải `<Header/>`, check tab Network thấy nó tải dạng docs với `full page load`, và dạng rsc-payload với `Subsequent Navigations`) thì khi sang các route khác (ở đây là sang /about), thì trình duyệt không cần tải lại JavaScript bundle `<Header />` nữa, check tab Network sẽ thấy ***không có thông tin gì về request `<Header />`, chứng tỏ nó đã lấy ra từ cache lần trước***
	+ Nếu một Client Component đã được render và có trạng thái, Next.js có thể giữ nguyên trạng thái đó khi navigate giữa các trang sử dụng cùng component.
	+ Nếu trang About có một Client Component mới mà Home không có, chẳng hạn <AboutSection />, thì JavaScript cho component này sẽ được tải về và hydrate.

+--------------------+--------------------+--------------------+--------------------+

## RSC Payload 
- là một định dạng dữ liệu đặc biệt chứa thông tin về cấu trúc và nội dung của components, được biểu diễn dưới dạng nhị phân	
	
+--------------------+--------------------+--------------------+--------------------+

## Lưu ý: 
- Giao diện của Server Component và Client Component `không hiển thị cùng lúc` trong Next.js 14, `Server component sẽ hiển thị trước`
-  Server sẽ render các Server Components cho đến khi gặp Client Component, sau đó nó sẽ "dừng lại" ở đó và chuyển sang nhánh tiếp theo.
- Trên client, NextJS sẽ "điền" các Client Components vào đúng vị trí của chúng trong cây component, dựa trên RSC Payload và JavaScript instructions.