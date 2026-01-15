/**
 * Skip Links Component
 *
 * Provides skip navigation links for keyboard users to bypass repetitive content
 */

import React from 'react';
import './skip-links.css';

export interface SkipLink {
  id: string;
  label: string;
}

export interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
];

export default function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Make target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-links-container">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
          onClick={(e) => handleClick(e, link.id)}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
