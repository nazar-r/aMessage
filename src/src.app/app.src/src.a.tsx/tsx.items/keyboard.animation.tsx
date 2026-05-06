// import { useEffect } from "react";

// function ChatPage() {
//     useEffect(() => {
//         const vv = window.visualViewport;
//         if (!vv) return;

//         const setKeyboardOffset = () => {
//             const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
//             document.documentElement.style.setProperty(
//                 "--keyboard-offset",
//                 `${Math.max(0, keyboardHeight)}px`
//             );
//         };

//         setKeyboardOffset();
//         vv.addEventListener("resize", setKeyboardOffset);
//         vv.addEventListener("scroll", setKeyboardOffset);

//         return () => {
//             vv.removeEventListener("resize", setKeyboardOffset);
//             vv.removeEventListener("scroll", setKeyboardOffset);
//             document.documentElement.style.removeProperty("--keyboard-offset");
//         };
//     }, []);

//     return (
//         <div className="chat-page">
//             {/* ... */}
//             <div className="chat-page__add-message">
//                 <div className="chat-page__add-message--pin">
//                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
//                 </div>
//                 <div onClick={handleSubmit} className="chat-page__add-message--icon">
//                     <svg width="14" height="14" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="1"><path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" /><path d="M17 7.34091V9.65909L0 9.65909L0 7.34091L17 7.34091Z" fill="white" /></g></svg>
//                 </div>
//                 <textarea
//                     className="chat-page__add-message--field"
//                     placeholder="Send Message"
//                     value={text}
//                     onChange={(e) => setText(e.target.value)}
//                 />
//             </div>
//         </div>
//     );
// }