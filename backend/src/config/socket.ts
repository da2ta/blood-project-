import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a room representing a specific hospital
    socket.on('join_hospital', (hospitalId: string) => {
      socket.join(`hospital_${hospitalId}`);
      console.log(`Socket ${socket.id} joined hospital_${hospitalId}`);
    });

    // Leave a hospital room
    socket.on('leave_hospital', (hospitalId: string) => {
      socket.leave(`hospital_${hospitalId}`);
      console.log(`Socket ${socket.id} left hospital_${hospitalId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

// Helper to notify a specific hospital
export const notifyHospital = (hospitalId: string, event: string, data: any) => {
  if (io) {
    io.to(`hospital_${hospitalId}`).emit(event, data);
  }
};

// Helper to broadcast globally (e.g. emergencies)
export const broadcastEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
