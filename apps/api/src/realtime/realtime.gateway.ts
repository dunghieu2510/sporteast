import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  MatchEvent,
  MatchUpdatePayload,
  ServerToClientEvents,
} from "@arena/types";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Kênh realtime: tỉ số/sự kiện trận và số người xem.
 * Khi chạy nhiều instance, gắn @socket.io/redis-adapter để broadcast qua Redis pub/sub.
 */
@WebSocketGateway({ namespace: "/live", cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" } })
export class RealtimeGateway {
  @WebSocketServer()
  server: IoServer;

  @SubscribeMessage("match:join")
  joinMatch(@ConnectedSocket() client: IoSocket, @MessageBody() matchId: string) {
    client.join(`match:${matchId}`);
  }

  @SubscribeMessage("match:leave")
  leaveMatch(@ConnectedSocket() client: IoSocket, @MessageBody() matchId: string) {
    client.leave(`match:${matchId}`);
  }

  @SubscribeMessage("chat:join")
  async joinChat(@ConnectedSocket() client: IoSocket, @MessageBody() streamId: string) {
    const room = `chat:${streamId}`;
    await client.join(room);
    const count = (await this.server.in(room).fetchSockets()).length;
    this.server.to(room).emit("viewers:count", { streamId, count });
  }

  /** Worker đồng bộ tỉ số gọi hàm này khi có thay đổi. */
  emitMatchUpdate(payload: MatchUpdatePayload) {
    this.server.to(`match:${payload.id}`).emit("match:update", payload);
  }

  emitMatchEvent(matchId: string, event: MatchEvent) {
    this.server.to(`match:${matchId}`).emit("match:event", { ...event, matchId });
  }
}
