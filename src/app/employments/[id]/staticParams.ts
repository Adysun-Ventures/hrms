export async function generateStaticParams() {
  // For static export, provide at least one placeholder path
  return [
    { id: 'placeholder' }
  ];
} 