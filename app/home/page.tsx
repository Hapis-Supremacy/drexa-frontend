import { redirect } from 'next/navigation';

// The new design uses the landing page as the public home and routes signed-in
// users straight into the app sections. /home now lands on the portfolio overview.
export default function Page() {
  redirect('/portfolio');
}
