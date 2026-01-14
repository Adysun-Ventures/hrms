import { redirect } from 'next/navigation';

export default function WebsiteNotFound() {
  // Instantly redirect to home page
  redirect('/');
}
