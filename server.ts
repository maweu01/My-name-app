import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Game state
  const players: Record<string, any> = {};
  const rooms: Record<string, string[]> = {};

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-room", (roomId: string, playerData: any) => {
      if (!roomId) roomId = 'lobby-1';
      socket.join(roomId);
      players[socket.id] = { ...playerData, id: socket.id, roomId };
      
      if (!rooms[roomId]) rooms[roomId] = [];
      if (!rooms[roomId].includes(socket.id)) {
        rooms[roomId].push(socket.id);
      }

      // Notify others in the room
      socket.to(roomId).emit("player-joined", players[socket.id]);
      
      // Send current players in room to the new player
      const roomPlayers = (rooms[roomId] || [])
        .map(id => players[id])
        .filter(p => !!p);
      
      socket.emit("current-players", roomPlayers);
    });

    socket.on("player-movement", (movementData: any) => {
      const player = players[socket.id];
      if (player && movementData) {
        player.x = movementData.x;
        player.y = movementData.y;
        player.flipX = movementData.flipX;
        player.anim = movementData.anim;
        
        socket.to(player.roomId).emit("player-moved", player);
      }
    });

    socket.on("player-shoot", (shootData: any) => {
      const player = players[socket.id];
      if (player && shootData) {
        socket.to(player.roomId).emit("bullet-fired", {
          playerId: socket.id,
          ...shootData
        });
      }
    });

    socket.on("player-hit", (hitData: any) => {
      if (hitData && hitData.targetId && players[hitData.targetId]) {
        io.to(players[hitData.targetId].roomId).emit("damage-applied", hitData);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      const player = players[socket.id];
      if (player) {
        const { roomId } = player;
        if (rooms[roomId]) {
          rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        }
        socket.to(roomId).emit("player-disconnected", socket.id);
        delete players[socket.id];
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
