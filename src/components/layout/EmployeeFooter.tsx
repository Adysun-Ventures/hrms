
import SocialMediaLinks from '@/components/ui/SocialMediaLinks';

export default function EmployeeFooter() {
  return (
    <footer className="mt-8">
      <div className="border-t border-gray-300 bg-green-50/80 backdrop-blur supports-[backdrop-filter]:bg-green-50/60">
        <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://adysunventures.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            adysunventures.com
          </a>

          <SocialMediaLinks variant="login" />
        </div>
      </div>
    </footer>
  );
}

