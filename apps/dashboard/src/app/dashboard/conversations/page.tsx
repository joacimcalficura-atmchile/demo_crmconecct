import { Suspense } from 'react';
import { api, type Conversation } from '@/lib/api';
import ConversationsClient from './ConversationsClient';

// Server Component: carga inicial de datos y delega al Client Component
export default async function ConversationsPage() {
  let conversations: Conversation[] = [];
  try {
    conversations = await api.getConversations();
  } catch { /* offline */ }

  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ConversationsClient initialConversations={conversations} />
    </Suspense>
  );
}
