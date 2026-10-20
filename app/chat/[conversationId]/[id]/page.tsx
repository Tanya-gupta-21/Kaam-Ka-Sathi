import { redirect } from "next/navigation";

export default async function LegacyChatRoute({
  params,
}: {
  params: Promise<{ conversationId: string; id: string }>;
}) {
  const { conversationId } = await params;
  redirect(`/chat/${encodeURIComponent(conversationId)}`);
}
