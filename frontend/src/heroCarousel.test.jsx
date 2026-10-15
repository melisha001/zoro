import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroCarousel from './components/public/HeroCarousel';

describe('HeroCarousel (Phase 4)', () => {
  it('renders neutral brand gradient when 0 images provided', () => {
    const { container } = render(
      <HeroCarousel images={[]}>
        <h1>Welcome to Zoro Academy</h1>
      </HeroCarousel>
    );

    expect(screen.getByText('Welcome to Zoro Academy')).toBeDefined();
    // No img elements rendered
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(0);
    // Neutral brand gradient section
    const section = container.querySelector('section');
    expect(section.className).toContain('from-slate-950');
  });

  it('renders static background with no indicator dots when exactly 1 image provided', () => {
    const singleImage = [
      { id: 'h1', url: 'https://cdn.bunny.net/hero1.webp', altText: 'Single Hero', active: true }
    ];

    const { container } = render(
      <HeroCarousel images={singleImage}>
        <h1>One Hero Image</h1>
      </HeroCarousel>
    );

    expect(screen.getByText('One Hero Image')).toBeDefined();
    const img = container.querySelector('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://cdn.bunny.net/hero1.webp');
    expect(img.getAttribute('alt')).toBe('Single Hero');

    // No indicator dots
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('renders carousel with indicator dots and slides when >1 images provided', () => {
    const multiImages = [
      { id: 'h1', url: 'https://cdn.bunny.net/hero1.webp', altText: 'Slide 1', active: true },
      { id: 'h2', url: 'https://cdn.bunny.net/hero2.webp', altText: 'Slide 2', active: true },
      { id: 'h3', url: 'https://cdn.bunny.net/hero3.webp', altText: 'Slide 3', active: true }
    ];

    const { container } = render(
      <HeroCarousel images={multiImages}>
        <h1>Carousel Mode</h1>
      </HeroCarousel>
    );

    expect(screen.getByText('Carousel Mode')).toBeDefined();
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(3);

    // Indicator dots present for all 3 images
    const dots = container.querySelectorAll('button');
    expect(dots.length).toBe(3);
  });
});
