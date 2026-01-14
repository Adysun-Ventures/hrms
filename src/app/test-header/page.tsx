'use client';

import PublicLayout from '@/components/layout/PublicLayout';

export default function TestHeaderPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto py-20">
          <h1 className="text-4xl font-bold mb-8">Test Header Page</h1>
          <p className="text-xl mb-6">
            This page is using the PublicLayout with a transparent header that has a blur effect.
          </p>
          <p className="text-lg mb-6">
            Scroll down to see how the header changes when you scroll.
          </p>
          
          {/* Add some content to enable scrolling */}
          <div className="space-y-12 mt-20">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-8 bg-white/10 backdrop-blur-md rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Section {i + 1}</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
                  auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget
                  aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies
                  tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
