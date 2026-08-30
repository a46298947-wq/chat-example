import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// تفعيل مشاركة الملفات الثابتة (مثل ملفات التنسيق والأكواد الفرعية بجانب index.html)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// استخدام مصفوفة لتخزين الزوار مع غرفهم
let users = [];

io.on('connection', (socket) => {
  console.log('user connected:', socket.id);

  socket.on('join', (data) => {
    socket.join(data.room);
    
    // حفظ الغرفة مع بيانات المستخدم لحذفها بشكل صحيح عند خروجه
    users.push({ id: socket.id, name: data.name, role: data.role, room: data.room });
    
    // إرسال قائمة المستخدمين المتواجدين في "هذه الغرفة فقط" وليس السيرفر كامل
    const roomUsers = users.filter(u => u.room === data.room);
    io.to(data.room).emit('users', roomUsers);
  });

  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', {
      name: data.name,
      text: data.text,
      role: data.role
    });
  });

  socket.on('disconnect', () => {
    // العثور على المستخدم قبل حذفه لمعرفة غرفته
    const user = users.find(u => u.id === socket.id);
    
    if (user) {
      const userRoom = user.room;
      // حذف المستخدم من القائمة
      users = users.filter(u => u.id !== socket.id);
      
      // تحديث القائمة للمستخدمين المتبقين في نفس الغرفة فقط
      const roomUsers = users.filter(u => u.room === userRoom);
      io.to(userRoom).emit('users', roomUsers);
    }
    
    console.log('user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
