import { Link } from 'react-router-dom';
import { Briefcase, Twitter, Linkedin, Facebook, Github, Mail } from 'lucide-react';

const socials = [
  { label: 'Twitter', href: 'https://twitter.com', Icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: Linkedin },
  { label: 'Facebook', href: 'https://facebook.com', Icon: Facebook },
  { label: 'GitHub', href: 'https://github.com', Icon: Github },
  { label: 'Email', href: 'mailto:hello@tenderhub.com', Icon: Mail },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* About Us */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TenderHub</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Connecting organizations with qualified bidders through a
              transparent, competitive tendering process. Built for fairness,
              speed, and trust.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Browse Tenders
                </Link>
              </li>
              <li>
                <Link to="/my-bids" className="transition-colors hover:text-white">
                  My Bids
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition-colors hover:text-white">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition-colors hover:text-white">
                  Become a Bidder
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Connect With Us
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-primary-600 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs">
          &copy; {new Date().getFullYear()} TenderHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
