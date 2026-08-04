// import { useCallback } from "react";
// import { decryptRoomText, encryptRoomText } from "../src.b.encryption/encryption.keys";
// import { useOneOnOneRoomMessagesQuery } from "./socket.b.chats/use.query.chats.adapter";
// import type { RemovedMessagePayload, NewMessagePayload } from "../src.b.extensions/types";
// import type { MessagesHistoryPayload, MessagesData, UseOneOnOneRoomQueryArgs, } from "../src.b.extensions/types";

// export const useOneOnOneRoomQuery = ({
//   peerWsId,
//   onCursorChange,
//   socketRef,
//   myKeyPairRef,
//   sharedKeyRef,
//   encryptedTextByMessageIdRef,
//   pendingOwnMessageIdsRef,
// }: UseOneOnOneRoomQueryArgs) => {
//   const {
//     queryClient,
//     roomId,
//     messagesKey,
//     messages,
//     sendMessageMutation,
//     setMessagesCache,
//     upsertMessageById,
//     replaceTempMessage,
//     removePendingTempId,
//   } = useOneOnOneRoomMessagesQuery({
//     onCursorChange,
//     peerWsId,
//     socketRef,
//     myKeyPairRef,
//     sharedKeyRef,
//     encryptedTextByMessageIdRef,
//     pendingOwnMessageIdsRef,
//   });

//   const sendMessage = useCallback((message: MessagesData) => {
//     const content = message.content.trim();
//     const hasContent = !!content;

//     const createTempMessageId = () => {
//       const hasRandomUUID = typeof crypto !== "undefined" && "randomUUID" in crypto;

//       return hasRandomUUID
//         ? `tmp-${crypto.randomUUID()}`
//         : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
//     };

//     const tempId = createTempMessageId();

//     hasContent
//       ? sendMessageMutation.mutate({
//         content,
//         tempId,
//       })
//       : undefined;
//   },
//     [sendMessageMutation]
//   );

//   const updateMessage = useCallback((messageId: string, newContent: string) => {
//     const socket = socketRef.current;
//     const sharedKey = sharedKeyRef.current;
//     const trimmed = newContent.trim();

//     const hasSocket = !!socket;
//     const hasSharedKey = !!sharedKey;
//     const hasContent = !!trimmed;

//     return !hasSocket
//       ? undefined
//       : !hasSharedKey
//         ? (console.error("E2EE shared key is not ready yet."), undefined)
//         : !hasContent
//           ? undefined
//           : (
//             encryptedTextByMessageIdRef.current.set(
//               messageId,
//               encryptRoomText(trimmed, sharedKey)
//             ),
//             upsertMessageById({
//               messageStatus: "mine",
//               messageId,
//               content: trimmed,
//             }),
//             socket.emit("updateMessage", {
//               messageId,
//               text: encryptRoomText(trimmed, sharedKey),
//             })
//           );
//   },
//     [encryptedTextByMessageIdRef, sharedKeyRef, socketRef, upsertMessageById]
//   );

//   const removeMessage = useCallback((messageId: string) => {
//     const socket = socketRef.current;
//     const messageElem = document.getElementById(messageId);

//     const hasSocket = !!socket;
//     const hasMessageElem = !!messageElem;

//     return hasSocket
//       ? hasMessageElem
//         ? (
//           messageElem.classList.remove("chat-message"),
//           messageElem.classList.add("chat-message--fade"),
//           setTimeout(() => {
//             setMessagesCache((prev) =>
//               prev.filter((msg) => msg.messageId !== messageId)
//             );

//             socket.emit("removeMessage", {
//               messageId,
//             });
//           }, 200)
//         )
//         : (
//           setMessagesCache((prev) =>
//             prev.filter((msg) => msg.messageId !== messageId)
//           ),
//           socket.emit("removeMessage", {
//             messageId,
//           })
//         )
//       : undefined;
//   },
//     [setMessagesCache, socketRef]
//   );

//   const rehydrateMessages = useCallback(() => {
//     const sharedKey = sharedKeyRef.current;

//     setMessagesCache((prev) =>
//       prev.map((msg) => {
//         const raw =
//           encryptedTextByMessageIdRef.current.get(msg.messageId) ?? msg.content;

//         return {
//           ...msg,
//           content: decryptRoomText(raw, sharedKey),
//         };
//       })
//     );
//   }, [encryptedTextByMessageIdRef, setMessagesCache, sharedKeyRef]);

//   const getNewMessage = useCallback((msg: NewMessagePayload) => {
//     encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);
//     const receivedMessage: MessagesData = {
//       messageStatus: msg.userId === peerWsId ? "got" : "mine",
//       messageId: msg.messageId,
//       content: decryptRoomText(msg.text, sharedKeyRef.current),
//     };

//     const isMine = msg.userId !== peerWsId;
//     const hasClientMessageId = !!msg.clientMessageId;
//     const fallbackTempId = pendingOwnMessageIdsRef.current[0];
//     const hasFallbackTempId = !!fallbackTempId;

//     return !isMine
//       ? upsertMessageById(receivedMessage)
//       : hasClientMessageId
//         ? (
//           removePendingTempId(msg.clientMessageId!),
//           replaceTempMessage(msg.clientMessageId!, receivedMessage)
//         )
//         : hasFallbackTempId
//           ? (
//             pendingOwnMessageIdsRef.current.shift(),
//             replaceTempMessage(fallbackTempId, receivedMessage)
//           )
//           : upsertMessageById(receivedMessage);
//   },
//     [
//       encryptedTextByMessageIdRef,
//       peerWsId,
//       pendingOwnMessageIdsRef,
//       replaceTempMessage,
//       removePendingTempId,
//       sharedKeyRef,
//       upsertMessageById,
//     ]
//   );

//   const getMessageRemoved = useCallback(({ messageId }: RemovedMessagePayload) => {
//     encryptedTextByMessageIdRef.current.delete(messageId);
//     removePendingTempId(messageId);

//     setMessagesCache((prev) => prev.filter((msg) => msg.messageId !== messageId));
//   },
//     [encryptedTextByMessageIdRef, removePendingTempId, setMessagesCache]
//   );

//   const getMessageUpdated = useCallback(
//     (msg: NewMessagePayload) => {
//       encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

//       const updatedMessage: MessagesData = {
//         messageStatus: msg.userId === peerWsId ? "got" : "mine",
//         messageId: msg.messageId,
//         content: decryptRoomText(msg.text, sharedKeyRef.current),
//       };

//       upsertMessageById(updatedMessage);
//     },
//     [encryptedTextByMessageIdRef, peerWsId, sharedKeyRef, upsertMessageById]
//   );

//   const getMessagesHistory = useCallback(({ messages: msgs, nextCursor }: MessagesHistoryPayload) => {
//     const isTempMessageId = (id: string) => id.startsWith("tmp-");
//     const formattedMessages: MessagesData[] = msgs.map((msg) => {
//       encryptedTextByMessageIdRef.current.set(msg.messageId, msg.text);

//       return {
//         messageStatus: msg.userId === peerWsId ? "got" : "mine",
//         messageId: msg.messageId,
//         content: decryptRoomText(msg.text, sharedKeyRef.current),
//       };
//     });

//     const currentMessages =
//       queryClient.getQueryData<MessagesData[]>(messagesKey) ?? [];

//     const optimisticOwnMessages = currentMessages.filter((msg) =>
//       isTempMessageId(msg.messageId)
//     );

//     queryClient.setQueryData<MessagesData[]>(messagesKey, [
//       ...formattedMessages,
//       ...optimisticOwnMessages,
//     ]);

//     onCursorChange(nextCursor);
//   },
//     [
//       encryptedTextByMessageIdRef,
//       messagesKey,
//       onCursorChange,
//       peerWsId,
//       queryClient,
//       sharedKeyRef,
//     ]
//   );

//   return {
//     roomId,
//     messages,
//     sendMessage,
//     removeMessage,
//     updateMessage,
//     rehydrateMessages,

//     getNewMessage,
//     getMessageRemoved,
//     getMessageUpdated,
//     getMessagesHistory,
//   };
// };