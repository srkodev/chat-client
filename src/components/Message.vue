<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import axios from 'axios';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import EmojiPicker from './EmojiPicker.vue';
import {
  PencilIcon,
  TrashIcon,
  FaceSmileIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

marked.setOptions({
  breaks: true
});

marked.use({
  renderer: {
    code(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  }
});

const props = defineProps<{
  message: {
    id: number | string;
    username?: string;
    content: string;
    timestamp?: string;
    createdAt?: string;
    avatar: string;
    senderId: number;
    reactions?: { emoji: string; count: number; users: number[] }[];
    isEdited?: boolean;
    replyTo?: {
      id?: number | string;
      _id?: number | string;
      senderId: number;
      username?: string;
      content: string;
    };
  };
  currentUser?: string;
  friendUsername?: string; // nom de l'ami passé par le parent
}>();

const emit = defineEmits(['reply', 'edit', 'delete', 'addReaction', 'removeReaction']);

const isEditing = ref(false);
const editedContent = ref(props.message.content);
const showReactionPicker = ref(false);
const pickerPosition = ref({ x: 0, y: 0 });
const reactionButtonRef = ref<HTMLButtonElement | null>(null);
const messageRef = ref<HTMLElement | null>(null);

const formattedContent = computed(() => {
  if (!props.message.content || typeof props.message.content !== 'string') {
    return '';
  }
  let content = props.message.content;
  content = content.replace(/@(\\w+)/g, '<span class="text-accent">$1</span>');
  return marked(content);
});

// Utiliser createdAt si timestamp n'existe pas
const formattedTimestamp = computed(() => {
  const ts = props.message.timestamp || props.message.createdAt;
  if (!ts) return '';
  return format(new Date(ts), "HH:mm - dd/MM/yyyy");
});

// Computed pour le nom à afficher : "You" si votre message, sinon le nom de l'ami passé via friendUsername
const displayedUsername = computed(() => {
  if (Number(props.currentUser) === props.message.senderId) {
    return "You";
  }
  return props.friendUsername || props.message.username || "";
});

const isOwnMessage = computed(() => {
  return Number(props.currentUser) === props.message.senderId;
});

const toggleReactionPicker = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLButtonElement;
  const rect = button.getBoundingClientRect();
  const pickerWidth = 320;
  let x = rect.left - pickerWidth;
  let y = rect.top;
  if (x < 0) x = 10;
  pickerPosition.value = { x, y };
  showReactionPicker.value = !showReactionPicker.value;
};

const saveEdit = () => {
  if (editedContent.value.trim() !== props.message.content) {
    emit('edit', {
      id: props.message.id,
      content: editedContent.value
    });
  }
  isEditing.value = false;
};

const cancelEdit = () => {
  editedContent.value = props.message.content;
  isEditing.value = false;
};

const handleEmojiSelect = (emoji: string) => {
  emit('addReaction', {
    messageId: props.message.id,
    emoji
  });
  showReactionPicker.value = false;
};

const removeReaction = (emoji: string) => {
  emit('removeReaction', {
    messageId: props.message.id,
    emoji
  });
};

const handleReactionClick = (reaction: { emoji: string; users: number[] }) => {
  const hasReacted = hasUserReacted(reaction.users, props.currentUser);
  if (hasReacted) {
    removeReaction(reaction.emoji);
  } else {
    handleEmojiSelect(reaction.emoji);
  }
};

const handleReply = () => {
  emit('reply', props.message);
};

const goToRepliedMessage = async () => {
  const replyId = props.message.replyTo?.id || props.message.replyTo?._id;
  if (!replyId) return;

  await nextTick();
  
  const targetElement = document.getElementById(`anchor-${replyId}`);
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
    
    targetElement.classList.add('highlight');
    setTimeout(() => {
      targetElement.classList.remove('highlight');
    }, 2000);
  }
};

const hasUserReacted = (users: number[], currentUser?: string) => {
  return currentUser ? users.includes(Number(currentUser)) : false;
};
</script>

<template>
  <div class="group relative" :id="'anchor-' + message.id" ref="messageRef">
    <!-- Affichage de la réponse -->
    <div v-if="message.replyTo" class="reply-container" @click="goToRepliedMessage">
      <div class="flex items-center gap-1">
        <ChatBubbleLeftIcon class="w-4 h-4" />
        <span class="text-xs text-gray-400">Réponse à <strong>{{ message.replyTo.username }}</strong></span>
      </div>
      <div class="text-sm text-gray-300 truncate">
        {{ message.replyTo.content }}
      </div>
    </div>

    <!-- Contenu principal du message -->
    <div class="flex items-start gap-4 hover:bg-chat-light/10 p-2 rounded-lg transition-colors">
      <img :src="message.avatar" alt="avatar" class="w-10 h-10 rounded-xl shrink-0" />
      
      <div class="min-w-0 flex-1">
        <!-- En-tête du message avec le nom, l'heure et la date -->
        <div class="mb-2 flex items-center gap-2">
          <span class="font-bold">{{ displayedUsername }}</span>
          <span class="text-xs text-gray-400">• {{ formattedTimestamp }}</span>
          <span v-if="message.isEdited" class="text-xs text-gray-400">(modifié)</span>
        </div>

        <!-- Contenu du message -->
        <div v-if="!isEditing"
             class="text-gray-300 break-words prose prose-invert max-w-none"
             v-html="formattedContent">
        </div>

        <!-- Mode édition -->
        <div v-else class="mt-2">
          <textarea
            v-model="editedContent"
            class="w-full bg-chat-darker rounded-lg p-2 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            @keydown.esc="cancelEdit"
            @keydown.enter.ctrl="saveEdit"
          ></textarea>
          <div class="flex items-center gap-2 mt-2 text-sm">
            <button
              @click="saveEdit"
              class="px-3 py-1 bg-accent text-chat-darker rounded-lg hover:bg-accent-hover"
            >
              <CheckIcon class="w-4 h-4" />
            </button>
            <button
              @click="cancelEdit"
              class="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
            <span class="text-gray-400">ESC pour annuler • CTRL + ENTER pour enregistrer</span>
          </div>
        </div>

        <!-- Réactions -->
        <div v-if="message.reactions && message.reactions.length > 0" 
             class="flex flex-wrap gap-2 mt-2">
          <button
            v-for="reaction in message.reactions"
            :key="reaction.emoji"
            @click="handleReactionClick(reaction)"
            :class="['flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors',
              hasUserReacted(reaction.users, currentUser) ? 'bg-accent/20 text-accent' : 'bg-chat-light hover:bg-chat-light/80']"
          >
            <span>{{ reaction.emoji }}</span>
            <span>{{ reaction.count }}</span>
          </button>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="handleReply" class="p-1 text-gray-400 hover:text-accent rounded">
          <ChatBubbleLeftIcon class="w-4 h-4" />
        </button>
        <button
          @click.stop="toggleReactionPicker"
          class="p-1 text-gray-400 hover:text-accent rounded"
          ref="reactionButtonRef"
        >
          <FaceSmileIcon class="w-4 h-4" />
        </button>
        <template v-if="isOwnMessage">
          <button @click="isEditing = true" class="p-1 text-gray-400 hover:text-accent rounded">
            <PencilIcon class="w-4 h-4" />
          </button>
          <button @click="$emit('delete', message.id)" class="p-1 text-gray-400 hover:text-red-500 rounded">
            <TrashIcon class="w-4 h-4" />
          </button>
        </template>
      </div>
    </div>

    <!-- Emoji Picker -->
    <EmojiPicker
      v-if="showReactionPicker"
      :position="pickerPosition"
      @select="handleEmojiSelect"
      @close="showReactionPicker = false"
    />
  </div>
</template>

<style>
/* Surlignage temporaire */
.highlight {
  animation: highlightFade 2s ease-out;
  background-color: rgba(0, 245, 212, 0.2);
}

@keyframes highlightFade {
  from { background-color: rgba(0, 245, 212, 0.2); }
  to { background-color: transparent; }
}

/* Styles existants */
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

/* Nouveau style pour le conteneur de réponse */
.reply-container {
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.2);
  border-left: 3px solid #4c1d95;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
}
.reply-container:hover {
  background-color: rgba(0, 0, 0, 0.3);
  border-left-color: #a78bfa;
}
</style>
