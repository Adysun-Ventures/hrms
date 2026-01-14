'use client'

import React, { useState } from 'react';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import SectionTitle from '@/components/website/ui/SectionTitle';
import { Image, Camera, Building, Users, Home, Stethoscope, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function GalleryPage() { 
  redirect('/');
  const [activeCategory, setActiveCategory] = useState('all');

  const galleryCategories = [
    { id: 'all', name: 'All Images', icon: <Image className="w-6 h-6" /> },
    { id: 'gallery', name: 'Gallery', icon: <Camera className="w-6 h-6" /> },
    { id: 'projects', name: 'Projects', icon: <Building className="w-6 h-6" /> },
    { id: 'team', name: 'Team', icon: <Users className="w-6 h-6" /> },
    { id: 'construction', name: 'Construction', icon: <Building className="w-6 h-6" /> },
    { id: 'interior', name: 'Interior', icon: <Home className="w-6 h-6" /> },
    { id: 'medical', name: 'Medical', icon: <Stethoscope className="w-6 h-6" /> },
    { id: 'blog', name: 'Blog', icon: <FileText className="w-6 h-6" /> }
  ];

  const galleryImages = [
    // Gallery Images
    { src: '/assets/images/gallery/2025-05-18 (1).jpg', alt: 'Gallery Image 1', category: 'gallery' },
    { src: '/assets/images/gallery/2025-05-18.jpg', alt: 'Gallery Image 2', category: 'gallery' },
    { src: '/assets/images/gallery/2025-04-23 (1).jpg', alt: 'Gallery Image 3', category: 'gallery' },
    { src: '/assets/images/gallery/2025-04-23 (2).jpg', alt: 'Gallery Image 4', category: 'gallery' },
    { src: '/assets/images/gallery/2025-04-23 (3).jpg', alt: 'Gallery Image 5', category: 'gallery' },
    { src: '/assets/images/gallery/2025-04-23 (4).jpg', alt: 'Gallery Image 6', category: 'gallery' },
    { src: '/assets/images/gallery/2025-04-23.jpg', alt: 'Gallery Image 7', category: 'gallery' },
    { src: '/assets/images/gallery/2025-04-23.png', alt: 'Gallery Image 8', category: 'gallery' },
    { src: '/assets/images/gallery/2025-05-13 (1).jpg', alt: 'Gallery Image 9', category: 'gallery' },
    { src: '/assets/images/gallery/2025-05-13.jpg', alt: 'Gallery Image 10', category: 'gallery' },
    
    // Project Images
    { src: '/assets/images/projects/masonry-1.jpg', alt: 'Project 1', category: 'projects' },
    { src: '/assets/images/projects/masonry-2.jpg', alt: 'Project 2', category: 'projects' },
    { src: '/assets/images/projects/masonry-3.jpg', alt: 'Project 3', category: 'projects' },
    { src: '/assets/images/projects/masonry-4.jpg', alt: 'Project 4', category: 'projects' },
    { src: '/assets/images/projects/masonry-5.jpg', alt: 'Project 5', category: 'projects' },
    { src: '/assets/images/projects/masonry-6.jpg', alt: 'Project 6', category: 'projects' },
    
    // Team Images
    { src: '/assets/images/team/team-01.jpg', alt: 'Team Member 1', category: 'team' },
    { src: '/assets/images/team/team-02.jpg', alt: 'Team Member 2', category: 'team' },
    { src: '/assets/images/team/team-03.jpg', alt: 'Team Member 3', category: 'team' },
    { src: '/assets/images/team/team-04.jpg', alt: 'Team Member 4', category: 'team' },
    { src: '/assets/images/team/team-05.jpg', alt: 'Team Member 5', category: 'team' },
    { src: '/assets/images/team/team-06.jpg', alt: 'Team Member 6', category: 'team' },
    
    // Construction Images
    { src: '/assets/images/construction/l-blog-1.jpg', alt: 'Construction Project 1', category: 'construction' },
    { src: '/assets/images/construction/l-blog-2.jpg', alt: 'Construction Project 2', category: 'construction' },
    { src: '/assets/images/construction/projects/construction-project-1.jpg', alt: 'Construction Project 3', category: 'construction' },
    { src: '/assets/images/construction/projects/construction-project-2.jpg', alt: 'Construction Project 4', category: 'construction' },
    
    // Interior Images
    { src: '/assets/images/interior/bg11.jpg', alt: 'Interior Design 1', category: 'interior' },
    { src: '/assets/images/interior/blog-10.jpg', alt: 'Interior Design 2', category: 'interior' },
    { src: '/assets/images/interior/blog-11.jpg', alt: 'Interior Design 3', category: 'interior' },
    { src: '/assets/images/interior/projects/interior-project-1.jpg', alt: 'Interior Project 1', category: 'interior' },
    { src: '/assets/images/interior/projects/interior-project-2.jpg', alt: 'Interior Project 2', category: 'interior' },
    
    // Medical Images
    { src: '/assets/images/medical/bg13.jpg', alt: 'Medical Facility 1', category: 'medical' },
    { src: '/assets/images/medical/bg18.jpg', alt: 'Medical Facility 2', category: 'medical' },
    { src: '/assets/images/medical/blog-13.jpg', alt: 'Medical Facility 3', category: 'medical' },
    { src: '/assets/images/medical/team/medical-team-1.jpg', alt: 'Medical Team 1', category: 'medical' },
    { src: '/assets/images/medical/team/medical-team-2.jpg', alt: 'Medical Team 2', category: 'medical' },
    
    // Blog Images
    { src: '/assets/images/blog/01.png', alt: 'Blog Post 1', category: 'blog' },
    { src: '/assets/images/blog/02.png', alt: 'Blog Post 2', category: 'blog' },
    { src: '/assets/images/blog/03.png', alt: 'Blog Post 3', category: 'blog' },
    { src: '/assets/images/blog/04.png', alt: 'Blog Post 4', category: 'blog' },
    { src: '/assets/images/blog/05.png', alt: 'Blog Post 5', category: 'blog' }
  ];

  const filteredImages = activeCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(image => image.category === activeCategory);

  return (
    <WebsiteLayout 
      title="Gallery - Adysun Ventures"
      description="Explore our visual portfolio showcasing projects, team, construction work, interior designs, and more. Get a glimpse of our expertise and creativity."
    >
      {/* Hero Section */}
      <section className="relative bg-cover bg-center bg-no-repeat py-20 mb-16"
               style={{ backgroundImage: 'url(/assets/images/bg/bg9.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Gallery</h1>
          <nav className="flex justify-center items-center space-x-2 text-white">
            <a href="/" className="hover:text-orange-400 transition-colors">Home</a>
            <span>/</span>
            <span className="text-orange-400">Gallery</span>
          </nav>
        </div>
      </section>

      {/* Gallery Categories Filter */}
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Explore Our Portfolio"
            subtitle="Browse through different categories of our work and achievements"
            alignment="center"
          />
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {galleryCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-orange-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                    <h3 className="text-lg font-semibold mb-2">{image.alt}</h3>
                    <p className="text-sm text-orange-300 capitalize">{image.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredImages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                <Image className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-600">Try selecting a different category or check back later for new content.</p>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Statistics */}
      <section className="bg-gray-50 py-16 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {galleryImages.filter(img => img.category === 'gallery').length}+
              </div>
              <div className="text-gray-600">Gallery Images</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {galleryImages.filter(img => img.category === 'projects').length}+
              </div>
              <div className="text-gray-600">Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {galleryImages.filter(img => img.category === 'team').length}+
              </div>
              <div className="text-gray-600">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {galleryImages.filter(img => img.category === 'construction').length}+
              </div>
              <div className="text-gray-600">Construction Sites</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Features */}
      <section className="mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-6">
                Showcasing Our Expertise
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our gallery represents the diverse range of projects and expertise we bring to every engagement. 
                From construction and interior design to medical facilities and team collaboration, each image 
                tells a story of innovation, quality, and commitment to excellence.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Browse through our visual portfolio to see how we've helped businesses across various industries 
                achieve their goals through innovative IT solutions and strategic consulting services.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-gray-700">High-quality project documentation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-gray-700">Professional team photography</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-gray-700">Before and after project comparisons</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-gray-700">Industry-specific showcases</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="/assets/images/gallery/2025-05-18 (1).jpg"
                  alt="Gallery Preview 1"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <img
                  src="/assets/images/projects/masonry-1.jpg"
                  alt="Project Preview 1"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              </div>
              <div className="space-y-4 pt-8">
                <img
                  src="/assets/images/team/team-01.jpg"
                  alt="Team Preview 1"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <img
                  src="/assets/images/construction/l-blog-1.jpg"
                  alt="Construction Preview 1"
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Let's discuss how we can help bring your vision to life with innovative IT solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact-us" 
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get in Touch
            </a>
            <a 
              href="/services" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              View Our Services
            </a>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
