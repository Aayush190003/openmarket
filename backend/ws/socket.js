/**
 * WebSocket Handler for Real-time Updates
 * Handles live price updates, trade feeds, and match status changes
 */
function initWebSocket(io) {
    io.on('connection', (socket) => {
        console.log(`📡 Client connected: ${socket.id}`);

        // Join market room
        socket.on('market:subscribe', (marketId) => {
            socket.join(`market:${marketId}`);
            console.log(`User ${socket.id} subscribed to market ${marketId}`);
        });

        // Leave market room
        socket.on('market:unsubscribe', (marketId) => {
            socket.leave(`market:${marketId}`);
        });

        // Join match room
        socket.on('match:subscribe', (matchId) => {
            socket.join(`match:${matchId}`);
        });

        socket.on('disconnect', () => {
            console.log(`📡 Client disconnected: ${socket.id}`);
        });
    });

    // Export broadcast functions
    io.broadcastPriceUpdate = (marketId, data) => {
        io.to(`market:${marketId}`).emit('market:priceUpdate', data);
    };

    io.broadcastNewTrade = (marketId, data) => {
        io.to(`market:${marketId}`).emit('market:newTrade', data);
        io.emit('global:newTrade', data); // Also send to all clients
    };

    io.broadcastMatchUpdate = (matchId, data) => {
        io.to(`match:${matchId}`).emit('match:statusUpdate', data);
        io.emit('global:matchUpdate', data);
    };

    return io;
}

module.exports = { initWebSocket };
