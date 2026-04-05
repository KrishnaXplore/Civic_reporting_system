const clients = new Map();

const addClient = (userId, res) => {
  clients.set(userId.toString(), res);
};

const removeClient = (userId) => {
  clients.delete(userId.toString());
};

const sendSSE = (userId, data) => {
  const client = clients.get(userId.toString());
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

module.exports = { addClient, removeClient, sendSSE };
