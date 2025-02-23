<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import io from 'socket.io-client';
import {
  ArrowLeftIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline';
import MessageInput from '../components/MessageInput.vue';
import Message from '../components/Message.vue';
import VoiceCall from '../components/VoiceCall.vue';

interface Friend {
  id: string;
  name: string;
  username: string;
  status: string;
  avatar: string;
}

const route = useRoute();
const router = useRouter();
const friendId = route.params.id as string;
const friend = ref<Friend>({
  id: friendId,
  name: '',
  username: '',
  status: '',
  avatar: ''
});

// Map pour suivre les messages en attente
const pendingMessages = new Map();
const messages = ref<any[]>([]);
const loadingMessages = ref(true);
const replyTo = ref<any>(undefined);
const anchorRef = ref<string | null>(null);

// Variables pour la gestion des appels
const incomingCall = ref<any>(null);
const incomingCallData = ref<any>(null); // Stocke les données complètes d’un appel entrant
// callType est utilisé pour lancer un appel sortant ; il sera mis à undefined lors d'un appel entrant
const callType = ref<'audio' | 'video' | undefined>(undefined);
const showCall = ref(false);

const currentUserId = (): number | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch (e) {
    return null;
  }
};

const updateMessageUsername = (msg: any) => {
  if (!msg.id && msg._id) {
    msg.id = msg._id;
  }
  const currentUser = currentUserId();
  msg.username = msg.senderId === currentUser ? "You" : friend.value.username || "";
  if (msg.replyTo) {
    if (!msg.replyTo.id && msg.replyTo._id) {
      msg.replyTo.id = msg.replyTo._id;
    }
    msg.replyTo.username = msg.replyTo.senderId === currentUser ? "You" : friend.value.username || "";
  }
  if (!msg.hasOwnProperty('reactions') || !msg.reactions) {
    msg.reactions = [];
  }
  return msg;
};

const scrollToBottom = async (smooth = false) => {
  await nextTick();
  setTimeout(async () => {
    const images = document.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(imagePromises);
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, 50);
};

watch(
  () => messages.value,
  async () => {
    if (!loadingMessages.value) {
      await scrollToBottom(true);
    }
  },
  { deep: true }
);

const fetchFriendInfo = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<Friend>(`http://localhost:4000/api/users/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    friend.value = response.data;
    messages.value.forEach(msg => updateMessageUsername(msg));
  } catch (err) {
    console.error("Erreur lors du chargement des infos de l'ami", err);
  }
};

const fetchConversation = async () => {
  try {
    loadingMessages.value = true;
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/messages/conversation/${friendId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Vérifiez si les messages sont dans response.data.messages
    const messageData = response.data.messages || response.data;
    
    messages.value = Array.isArray(messageData) 
      ? messageData
          .map(updateMessageUsername)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      : [];

    await nextTick();
    await scrollToBottom(false);
  } catch (err) {
    console.error('Erreur lors du chargement de la conversation:', err);
  } finally {
    loadingMessages.value = false;
  }
};

let socket: any;
socket = io("http://localhost:5000", {
  auth: { token: localStorage.getItem("token") }
});

socket.on("newMessage", (msg: any) => {
  const currentUser = currentUserId();
  msg = updateMessageUsername(msg);
  const isRelevantMessage = (
    (msg.senderId === parseInt(friendId, 10) && msg.recipientId === currentUser) ||
    (msg.senderId === currentUser && msg.recipientId === parseInt(friendId, 10))
  );
  if (!isRelevantMessage) return;
  if (msg.senderId === currentUser) {
    const pendingMsg = pendingMessages.get(msg.content);
    if (pendingMsg) {
      const index = messages.value.findIndex(m => m === pendingMsg);
      if (index !== -1) {
        messages.value.splice(index, 1, msg);
      }
      pendingMessages.delete(msg.content);
    }
  } else {
    if (!messages.value.some(m => m.id === msg.id)) {
      messages.value.push(msg);
    }
  }
  updateAnchor(msg.id);
  scrollToBottom(true);
});

socket.on("reactionAdded", ({ messageId, reactions }: { messageId: number, reactions: any[] }) => {
  const msg = messages.value.find(m => m.id === messageId);
  if (msg) {
    msg.reactions = reactions;
  }
});

socket.on("reactionRemoved", ({ messageId, reactions }: { messageId: number, reactions: any[] }) => {
  const msg = messages.value.find(m => m.id === messageId);
  if (msg) {
    msg.reactions = reactions;
  }
});

socket.on("messageUpdated", (updatedMsg: any) => {
  const index = messages.value.findIndex(m => m.id === updatedMsg._id || m.id === updatedMsg.id);
  if (index !== -1) {
    messages.value.splice(index, 1, updateMessageUsername(updatedMsg));
  }
});

socket.on("messageDeleted", ({ id }: { id: number | string }) => {
  const index = messages.value.findIndex(m => m.id === id);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
});

// Lorsqu'un appel entrant est reçu, on stocke les données dans "incomingCall"
socket.on("callIncoming", (data: any) => {
  incomingCall.value = data;
});

onMounted(async () => {
  await fetchFriendInfo();
  await fetchConversation();
  const urlParams = new URLSearchParams(window.location.search);
  const anchorId = urlParams.get('anchor');
  if (anchorId) {
    await nextTick();
    const anchorElement = document.getElementById(anchorId);
    if (anchorElement) {
      anchorElement.scrollIntoView({ behavior: 'smooth' });
    }
  } else {
    await scrollToBottom(false);
  }
});

onBeforeUnmount(() => {
  if (socket) {
    socket.disconnect();
  }
});

const sendMessage = async ({ content, replyTo: reply }: { content: string; replyTo: any }) => {
  try {
    const token = localStorage.getItem('token');
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId(),
      recipientId: parseInt(friendId, 10),
      replyTo: reply ? { ...reply } : undefined,
      pending: true,
      reactions: []
    };
    updateMessageUsername(tempMessage);
    messages.value.push(tempMessage);
    pendingMessages.set(content, tempMessage);
    updateAnchor(tempMessage.id);
    await scrollToBottom(true);
    const response = await axios.post<{ message: string; data: any }>(
      'http://localhost:5000/api/messages',
      {
        content,
        recipientId: parseInt(friendId, 10),
        replyTo: reply ? reply.id : undefined
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const newMsg = response.data.data;
    const index = messages.value.findIndex(m => m.id === tempMessage.id);
    if (index !== -1) {
      messages.value.splice(index, 1, newMsg);
    }
    pendingMessages.delete(content);
    socket.emit("sendMessage", newMsg);
  } catch (err) {
    console.error('Erreur lors de l\'envoi du message', err);
    messages.value = messages.value.filter(m => m !== pendingMessages.get(content));
    pendingMessages.delete(content);
  }
  replyTo.value = undefined;
};

const updateAnchor = (messageId: string) => {
  if (anchorRef.value) {
    const oldAnchor = document.getElementById(anchorRef.value);
    if (oldAnchor) {
      oldAnchor.removeAttribute('id');
    }
  }
  const newAnchor = document.getElementById(messageId);
  if (newAnchor) {
    newAnchor.id = `anchor-${messageId}`;
    anchorRef.value = `anchor-${messageId}`;
  }
};

const handleReply = (message: any) => {
  replyTo.value = message;
};

const handleEdit = async ({ id, content }: { id: number; content: string }) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:5000/api/messages/${id}`,
      { content },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error('Erreur lors de la modification du message', err);
  }
};

const handleDelete = async (id: number) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.error('Erreur lors de la suppression du message', err);
  }
};

const emitAddReaction = async (messageId: number, emoji: string) => {
  if (!messageId) return;
  try {
    const token = localStorage.getItem("token");
    await axios.post<{ message: string; reactions: any }>(
      `http://localhost:5000/api/messages/${messageId}/reactions`,
      { emoji },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error("Erreur lors de l'ajout de la réaction", err);
  }
};

const emitRemoveReaction = async (messageId: number, emoji: string) => {
  if (!messageId) return;
  try {
    const token = localStorage.getItem("token");
    await axios.delete<{ message: string; reactions: any }>(
      `http://localhost:5000/api/messages/${messageId}/reactions`,
      {
        params: { emoji },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  } catch (err) {
    console.error("Erreur lors du retrait de la réaction", err);
  }
};

const handleAddReaction = ({ messageId, emoji }: { messageId: number; emoji: string }) => {
  if (String(messageId).startsWith('temp-')) {
    console.error("Le message est en attente de validation, veuillez patienter.");
    return;
  }
  emitAddReaction(messageId, emoji);
};

const handleRemoveReaction = ({ messageId, emoji }: { messageId: number; emoji: string }) => {
  if (String(messageId).startsWith('temp-')) {
    console.error("Le message est en attente de validation, veuillez patienter.");
    return;
  }
  emitRemoveReaction(messageId, emoji);
};

// Fonctions pour la gestion des appels

// Pour un appel sortant, on définit le type et on affiche le composant d'appel
const startCallFunction = (type: 'audio' | 'video') => {
  callType.value = type;
  showCall.value = true;
};

// Lorsqu'on met fin à l'appel, on réinitialise
const endCallFunction = () => {
  showCall.value = false;
  callType.value = undefined;
  incomingCallData.value = null;
};

// Modification de la fonction d'acceptation d'appel : 
// Lorsqu'on accepte un appel entrant, on stocke les données dans incomingCallData
// et on supprime le type pour éviter de lancer un nouvel appel.
const acceptIncomingCall = () => {
  if (incomingCall.value) {
    incomingCallData.value = incomingCall.value;
    callType.value = undefined; // On efface le type pour indiquer qu'il s'agit d'un appel entrant
    showCall.value = true;
    incomingCall.value = null;
  }
};

const declineIncomingCall = () => {
  socket.emit("endCall", { to: incomingCall.value.from });
  incomingCall.value = null;
};
</script>

<template>
  <div class="relative min-h-screen bg-chat-dark">
    <header class="fixed top-0 left-0 right-0 z-10 p-4 bg-transparent">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="router.push('/friends')" class="text-accent hover:text-accent-hover">
            <ArrowLeftIcon class="w-5 h-5" />
          </button>
          <img :src="friend.avatar" alt="avatar" class="w-12 h-12 rounded-xl" />
          <div>
            <h2 class="font-bold">{{ friend.username }}</h2>
            <p class="text-sm text-gray-400">{{ friend.status }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="startCallFunction('audio')" class="p-2 text-accent hover:text-accent-hover rounded-lg">
            <PhoneIcon class="w-5 h-5" />
          </button>
          <button @click="startCallFunction('video')" class="p-2 text-accent hover:text-accent-hover rounded-lg">
            <VideoCameraIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

    <main class="mt-20 mb-20 p-6 space-y-6" style="scroll-behavior: smooth;">
      <div v-if="loadingMessages" class="text-white">Chargement...</div>
      <Message
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :currentUser="String(currentUserId())"
        @reply="handleReply"
        @edit="handleEdit"
        @delete="handleDelete"
        @addReaction="handleAddReaction"
        @removeReaction="handleRemoveReaction"
      />
      <div id="end-of-content"></div>
    </main>

    <footer class="fixed bottom-0 left-0 right-0 z-10 p-4 bg-transparent">
      <MessageInput
        @send="sendMessage"
        :replyTo="replyTo"
        @cancelReply="replyTo = undefined"
      />
    </footer>

    <!-- Pop-up d'appel entrant -->
    <div v-if="incomingCall" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg text-center">
        <p class="mb-4">Appel entrant de {{ friend.username }}</p>
        <div class="flex justify-center gap-4">
          <button @click="acceptIncomingCall" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Accepter
          </button>
          <button @click="declineIncomingCall" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Refuser
          </button>
        </div>
      </div>
    </div>

    <!-- Affichage du composant d'appel -->
    <VoiceCall
      v-if="showCall"
      :user="friend"
      :type="callType"
      :incomingCallData="incomingCallData"
      :socket="socket"
      @end="endCallFunction"
    />
  </div>
</template>

<style>
.bg-chat-dark {
  background-color: #0a0f2d;
}

.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.loading {
  opacity: 0.7;
  pointer-events: none;
}

.prose {
  color: rgb(209 213 219);
}
.prose img {
  border-radius: 0.5rem;
  max-width: 300px;
  height: auto;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.prose pre {
  background-color: rgb(24 24 27);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  overflow-x: auto;
}
.prose code {
  background-color: rgb(24 24 27);
  padding: 0.25rem 0.375rem;
  border-radius: 0.25rem;
}
.prose pre code {
  background-color: transparent;
  padding: 0;
}
.prose blockquote {
  border-left: 4px solid rgb(76 29 149);
  padding-left: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.prose p {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.prose ul {
  list-style-type: disc;
  padding-left: 1.5rem;
}
.prose ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
}
.prose li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.prose a {
  color: rgb(139 92 246);
  text-decoration: underline;
}
.prose a:hover {
  color: rgb(167 139 250);
}
</style>
