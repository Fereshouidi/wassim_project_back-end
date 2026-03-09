import { Server } from 'socket.io';
import { purchaseSoket } from './purchase.js';
import { orderSoket } from './order.js';
// import messageSocket from './message.js';
// import conversationSocket from './conversation.js';

export default function registerSocketHandlers(io: Server) {
  io.on("connect", (socket) => {

    purchaseSoket(socket as unknown as Server);
    orderSoket(socket as unknown as Server);

    socket.on("disconnect", () => {
    });
  });
}
