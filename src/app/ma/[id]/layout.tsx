import type { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  return {
    manifest: `/api/ma-manifest?id=${id}`,
  };
}

export default function MALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
