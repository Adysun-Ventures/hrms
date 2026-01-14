import React from 'react';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import PageHero from '@/components/website/ui/PageHero';
import TechnologyCategoryCard from '@/components/website/TechnologyCategoryCard';
import { Rocket, Users, Wrench, Code, Database, Cloud, Brain, ShoppingCart } from 'lucide-react';

export default function TechnologiesPage() {
  // Technology categories and their items
  const technologyCategories = [
    {
      title: "Mobility",
      icon: <Code />,
      technologies: [
        { name: "Android", logo: "/assets/images/brand-logos/adysunventures_android.png" },
        { name: "iOS", logo: "/assets/images/brand-logos/adysunventures_apple.png" },
        { name: "React Native", logo: "/assets/images/brand-logos/adysunventures_react.png" },
        { name: "Flutter", logo: "/assets/images/brand-logos/adysunventures_flutter.png" },
        { name: "Electron.js", logo: "/assets/images/brand-logos/adysunventures_electron.png" },
      ]
    },
    {
      title: "JavaScript & Frontend",
      icon: <Code />,
      technologies: [
        { name: "JavaScript", logo: "/assets/images/brand-logos/adysunventures_javascript.png" },
        { name: "Angular", logo: "/assets/images/brand-logos/adysunventures_angular.png" },
        { name: "Vue.js", logo: "/assets/images/brand-logos/adysunventures_vuejs.png" },
        { name: "React.js", logo: "/assets/images/brand-logos/adysunventures_react.png" },
        { name: "Bootstrap", logo: "/assets/images/brand-logos/adysunventures_bootstrap.png" },
        { name: "HTML5", logo: "/assets/images/brand-logos/adysunventures_html5.png" },
        { name: "CSS3", logo: "/assets/images/brand-logos/adysunventures_css3.png" },
        { name: "jQuery", logo: "/assets/images/brand-logos/adysunventures_jquery.png" }
      ]
    },
    {
      title: "Big Data & Analytics",
      icon: <Database />,
      technologies: [
        { name: "Hadoop", logo: "/assets/images/brand-logos/adysunventures_hadoop.png" },
        { name: "Power BI", logo: "/assets/images/brand-logos/adysunventures_powerbi.png" },
        { name: "Big Data", logo: "/assets/images/brand-logos/adysunventures_bigdata.png" },
        { name: "Tableau", logo: "/assets/images/brand-logos/adysunventures_tableau.png" },
        { name: "Apache Spark", logo: "/assets/images/brand-logos/adysunventures_apache-spark.png" },
        { name: "MongoDB", logo: "/assets/images/brand-logos/adysunventures_mongodb.png" }
      ]
    },
    {
      title: "Backend Development",
      icon: <Code />,
      technologies: [
        { name: "PHP", logo: "/assets/images/brand-logos/adysunventures_php.png" },
        { name: "Laravel", logo: "/assets/images/brand-logos/adysunventures_laravel.png" },
        { name: "Java", logo: "/assets/images/brand-logos/adysunventures_java.png" },
        { name: "Python", logo: "/assets/images/brand-logos/adysunventures_python.png" },
        { name: "Go", logo: "/assets/images/brand-logos/adysunventures_go.png" }
      ]
    },
    {
      title: "Cloud & DevOps",
      icon: <Cloud />,
      technologies: [
        { name: "AWS", logo: "/assets/images/brand-logos/adysunventures_aws.png" },
        { name: "Azure", logo: "/assets/images/brand-logos/adysunventures_azure.png" },
        { name: "Docker", logo: "/assets/images/brand-logos/adysunventures_docker.png" },
        { name: "Kubernetes", logo: "/assets/images/brand-logos/adysunventures_kubernetes.png" },
        { name: "Jenkins", logo: "/assets/images/brand-logos/adysunventures_jenkins.png" },
        { name: "GitHub", logo: "/assets/images/brand-logos/adysunventures_github.png" }
      ]
    },
    {
      title: "Blockchain, ML & AI",
      icon: <Brain />,
      technologies: [
        { name: "TensorFlow", logo: "/assets/images/brand-logos/adysunventures_tensorflow.png" },
        { name: "PyTorch", logo: "/assets/images/brand-logos/adysunventures_pytorch.png" },
      ]
    },
    {
      title: "E-Commerce & CMS",
      icon: <ShoppingCart />,
      technologies: [
        { name: "WordPress", logo: "/assets/images/brand-logos/adysunventures_wordpress.png" },
        { name: "Shopify", logo: "/assets/images/brand-logos/adysunventures_shopify.png" },
      ]
    }
  ];

  const benefits = [
    {
      icon: <Rocket />,
      title: "Fast Development",
      description: "We build fast and deliver quality solutions within your timeline, ensuring your project stays on track."
    },
    {
      icon: <Users />,
      title: "4200+ Projects Completed",
      description: "We have successfully completed hundreds of projects and are ready to explore new ventures."
    },
    {
      icon: <Wrench />,
      title: "Free Project Management",
      description: "We not only build fast but also free you from management issues. You get a PM from our side."
    }
  ];

  return (
    <WebsiteLayout 
      title="Technologies - Overview Of Our Diverse Technology Competency"
      description="Adysun Ventures offers comprehensive technology solutions across Mobility, Frontend, Backend, Big Data, AI/ML, Blockchain, and E-Commerce platforms. Hire skilled developers for your software development needs."
    >
      {/* Page Hero Section */}
      <PageHero
        title="Technologies"
        description="Adysun Ventures is a software development firm offering software developers / engineers / programmers to hire on hourly, part time or monthly basis. We focus on creating scalable, high performing, and secure software solutions for all the industry verticals."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Technologies', isActive: true }
        ]}
      />

      {/* Technology Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Overview Of Our Diverse Technology Competency
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Adysun Ventures is dedicated to offer technology solutions for all industry verticals. We have a team of skilled programmers experienced in diverse technology set ranging from mobility, web development to Blockchain, AI, Ecommerce, CMS and more. Take a look at the core technologies our developers hold comprehensive expertise in.
            </p>
          </div>

          {/* Technology Categories Grid */}
          <div className="space-y-16">
            {technologyCategories.map((category, index) => (
              <TechnologyCategoryCard
                key={index}
                title={category.title}
                icon={category.icon}
                technologies={category.technologies}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Hire Developers Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Hire Developers from Adysun Ventures?
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              We provide skilled developers who deliver quality solutions with proven expertise across multiple technologies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-white [&_*]:w-8 [&_*]:h-8">{benefit.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-100/90 to-orange-200/90 text-gray-800 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/90 to-orange-200/90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Ready to Hire Skilled Developers?
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-10">
              Get in touch with us to discuss your development needs and find the perfect developers for your project.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a 
              href="/contact-us" 
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              Contact Us Now
            </a>
            <a 
              href="/services" 
              className="bg-white text-orange-600 border-2 border-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 hover:text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              View Our Services
            </a>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}