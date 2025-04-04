#### src: https://www.youtube.com/watch?v=eiC58R16hb8

# Event loop là gì ?
- Event Loop là một cơ chế trong JavaScript cho phép xử lý các tác vụ bất đồng bộ trong khi vẫn duy trì tính đơn luồng (single-threaded) của ngôn ngữ. Nó hoạt động như một vòng lặp vô tận, liên tục kiểm tra Call Stack và các Queue để điều phối việc thực thi code

# Event loop có mục đích gì ?
- Trong JavaScript chỉ có `đơn luồng` thay vì `đa luồng` như các ngôn ngữ khác, chả lẽ nó gặp await xong phải đợi thực thi xong, mới được thực thi các cái khác à? 
- Ví dụ có 2 button, click button 1 gọi api fetch, trong lúc fetch, click button 2, chả lẽ button 1 phải fetch xong, thì click button 2 mới thực thi ? Vì `đơn luồng` chỉ xử lý 1 luồng trong 1 thời điểm thôi, vậy nên lúc này `event loop` sinh ra để giải quyết điều này

# Event loop hoạt động như nào ?

## Sẽ có 4 quy trình chạy code 
*** fun fact: Các tác vụ đồng bộ thì sẽ không chạy qua event loop, mà nó chạy thẳng vào callstack luôn ***

### 1. CALL STACK:
- Đây là nơi code được thực thi theo thứ tự từ trên xuống dưới. Khi một hàm được gọi, nó sẽ được đẩy vào call stack để thực thi.
- *** Các tác vụ đồng bộ sẽ chạy thẳng vào call stack mà không cần thông qua event loop ***

### 2. Web API:
- Các API bất đồng bộ (asynchronous) như setTimeout, HTTP requests, file I/O, etc. được đẩy ra khỏi call stack và thực hiện trong các Web API
- `Được đẩy ra là như nào ?` tức là nếu 1 đoạn code bất đồng bộ -> nó sẽ nhảy vào call stack trước, và bị phát hiện là asynchronous -> bị đẩy sang web api đợi chạy xong thì nó nhảy sang bước 3

#### Ở phần 2 này sẽ dễ bị nhầm lẫn nè
- Ví dụ:
```js 
const button1 = document.querySelector('#myButton1');
const button2 = document.querySelector('#myButton2');

// Event Handler 1 - có await
button1.addEventListener('click', async () => {
  console.log('1: Handler 1 start');
  
  // Giả lập một async task mất 2 giây
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('3: Handler 1 after await');
});

// Event Handler 2 - synchronous
button2.addEventListener('click', () => {
  console.log('2: Handler 2 executed');
});

// Output khi click:
// 1: Handler 1 start
// 2: Handler 2 executed
// ... 2 giây sau ...
// 3: Handler 1 after await
```
- Khi button1 được click:
	+ Event Loop đẩy handler 1 vào Call Stack
	+ `console.log('1: Handler 1 start')` được thực thi
	+ Gặp `await` → Promise được tạo và xử lý ở background
	+ Handler 1 tạm dừng, code sau await được wrap trong .then()
	+ Khi nào xong thì Promise resolve được ném vào `Microtask queue`
	
- Event Loop tiếp tục kiểm tra xem còn tác vụ nào không
	+ Lúc này không có, nên hiện tại trong callstack đang trống, và event loop `đang nghỉ ngơi` ( kiểu kiểu vậy kkk )

- Lúc này click button2, `Event loop` thấy có tác vụ, nhanh chóng thực hiện:
	+ Handler 2 được đẩy vào Call Stack
	+ console.log('2: Handler 2 executed') được thực thi
	+ Handler 2 hoàn thành

- Sau 2 giây:
	+ Promise resolve
	+ Callback được đưa vào Microtask Queue
	+ Event Loop kiểm tra và thực thi Microtask
	+ console.log('3: Handler 1 after await') được thực thi

### 3. Task Queue/Microtask Queue: HÀNG ĐỢI CALL STACK RỖNG ĐỂ NHẢY VÀO VÀ THỰC HIỆN
- Khi một API bất đồng bộ hoàn thành, nó sẽ được đẩy vào một hàng đợi tương ứng (Task Queue hoặc Microtask Queue), sau đó sẽ dựa vào `event loop` đưa lên `callstack` để thực thi
	+ Task Queue được sử dụng cho các tác vụ như fetch, setTimeout, setInterval, các sự kiện DOM.
	+ Microtask Queue được sử dụng cho Promise, MutationObserver (cái này chưa tìm hiểu :v)


### 4. Event Loop
- Event loop liên tục kiểm tra call stack và các hàng đợi tác vụ (chính là 2 cái hàng đợi `task queue` và `microtask queue` ở `BƯỚC 3`. Nếu call stack rỗng và có tác vụ trong hàng đợi (Task Queue/Microtask Queue), `event loop` sẽ lấy tác vụ đó ra khỏi hàng đợi và đẩy vào call stack để thực thi.

#### TẠI BƯỚC 4: Task Queue/Microtask Queue, EVENT LOOP ƯU TIÊN CÁI NÀO ĐI TRƯỚC ?
-  Tuỳ vào cách thực hiện cụ thể của engine JavaScript được sử dụng, NHƯNG THEO QUY CHUẨN Microtask Queue sẽ được ưu tiên trước Task Queue, cụ thể:
	- Microtask Queue được ưu tiên cao hơn và sẽ được xử lý trước khi xử lý Task Queue.
	- Event Loop sẽ kiểm tra xem Call Stack có rỗng không. Nếu Call Stack rỗng
		+ Nó sẽ kiểm tra Microtask Queue trước. Nếu Microtask Queue không rỗng, nó sẽ lấy tất cả các Microtasks ra khỏi hàng đợi và đẩy chúng vào Call Stack lần lượt để thực thi.
		+ Sau khi Microtask Queue rỗng, nó sẽ kiểm tra Task Queue. Nếu Task Queue không rỗng, nó sẽ lấy một task ra khỏi đầu hàng đợi và đẩy vào Call Stack để thực thi.
		+ Tất cả Microtasks sẽ được xử lý hết trước khi chuyển sang Task tiếp theo, kể cả những Microtasks mới được thêm vào trong quá trình xử lý (CÁI NÀY LIÊN QUAN SÂU ĐẾN VIỆC XỬ LÝ setState CỦA REACTJS, ĐỌC FILE `ban-da-hieu-het-ve-setState.md`

### Ví dụ
```js
console.log('Script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('Promise1'))
  .then(() => console.log('Promise2'));

console.log('Script end');

// Kết quả:
// Script start
// Script end
// Promise1
// Promise2
// setTimeout
```

- Giải thích: 
setTimeout --> callstack --> bị ném sang WEB APIS --> Chạy xong thì nhảy vào Task Queue
Promise.resolve() --> callstack --> bị ném sang WEB APIS --> Chạy xong thì nhảy vào Microtask Queue

- Vì cả 2 thằng đều chạy xong cùng lúc (0s), nên lúc này cả Task Queue và Microtask Queue đều có dữ liệu

- NHƯNG Event loop lại chạy Microtask Queue trước do độ ưu tiên 

- DO ĐÓ 
	+ // Promise1
	+ // Promise2
	+ SẼ ĐƯỢC IN RA TRƯỚC setTimeout