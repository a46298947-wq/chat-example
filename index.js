import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server);
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'index.html')));
let users=[];
io.on('connection', s=>{
 s.on('join', d=>{ s.data=d; s.join(d.room); users.push({id:s.id,name:d.name,role:d.role}); io.emit('users',users); });
 s.on('chat message', d=>{ io.to(d.room).emit('chat message',{name:s.data.name,text:d.text,role:s.data.role}); });
 s.on('disconnect',()=>{ users=users.filter(u=>u.id!=s.id); io.emit('users',users); });
});
server.listen(process.env.PORT||3000);
