import React from 'react';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import PageHero from '@/components/website/ui/PageHero';
import SectionTitle from '@/components/website/ui/SectionTitle';
import PartnerCard from '@/components/website/PartnerCard';
import BenefitCard from '@/components/website/BenefitCard';
import TechStackCard from '@/components/website/TechStackCard';
import CTAButton from '@/components/website/CTAButton';
import { Rocket, Target, Cloud, Shield, Lightbulb } from 'lucide-react';
import { SiLinux, SiGitlab } from 'react-icons/si';

export default function PartnersPage() {
  const partners = [
    {
      name: "SUSE",
      logo: "/assets/images/content/susu.png",
      partnership: "Emerald Partner",
      description: "Our team offers comprehensive capabilities and expertise in designing, implementing, and deploying scalable and reliable solutions across the entire SUSE and Rancher technology stack. This expertise spans a broad range of enterprise solutions and technologies, including the management of physical and virtual environments, software-defined storage, and cloud environments. Additionally, we possess deep knowledge in utilizing the Rancher platform to effectively manage container sprawl across both physical and cloud environments."
    },
    {
      name: "RED HAT",
      logo: "/assets/images/content/redHat.png",
      partnership: "READY PARTNER",
      description: "Red Hat's comprehensive portfolio, encompassing hybrid cloud infrastructure, cloud-native application development, agile integration, management, and automation solutions, empowers businesses to seamlessly integrate Red Hat technologies as they transition to digital and interconnected models."
    },
    {
      name: "CANONICAL",
      logo: "/assets/images/content/canonical.png",
      partnership: "BUSINESS PARTNER",
      description: "Canonical offers comprehensive services for open source solutions, spanning from cloud to desktop and devices. Their support for Ubuntu-based solutions helps reduce infrastructure costs and boosts application performance. With Canonical's backing, Ubuntu has become the new standard for secure enterprise Linux, catering to servers, desktops, cloud, developers, and IoT devices."
    },
    {
      name: "GITLAB",
      logo: "/assets/images/content/gitLab.png",
      partnership: "BUSINESS PARTNER",
      description: "GitLab is a DevOps Platform that enables organizations to optimize software development by accelerating software delivery and improving efficiency, while enhancing security and compliance. Through GitLab, all teams within your organization can jointly plan, develop, secure, and deploy software to accelerate business results with full visibility, uniformity, and accountability across the entire DevOps lifecycle."
    }
  ];

  const benefits = [
    {
      icon: <Rocket />,
      title: "Access to Latest Technology",
      description: "Early access to cutting-edge technologies and beta programs from our partners"
    },
    {
      icon: <Target />,
      title: "Expert Training & Support",
      description: "Certified expertise and dedicated support channels for optimal solution delivery"
    },
    {
      icon: <Lightbulb />,
      title: "Innovation & Best Practices",
      description: "Access to industry best practices and innovative solution architectures"
    }
  ];

  const techStack = [
    {
      icon: <SiLinux />,
      title: "Linux Solutions",
      subtitle: "SUSE, Red Hat, Ubuntu"
    },
    {
      icon: <Cloud />,
      title: "Cloud & Container",
      subtitle: "Rancher, Kubernetes"
    },
    {
      icon: <SiGitlab />,
      title: "DevOps Platform",
      subtitle: "GitLab, CI/CD"
    },
    {
      icon: <Shield />,
      title: "Enterprise Security",
      subtitle: "Compliance & Security"
    }
  ];

  return (
    <WebsiteLayout 
      title="Our Partners - Adysun Ventures"
      description="Strategic technology partnerships with industry leaders including SUSE, Red Hat, Canonical, and GitLab to deliver comprehensive IT solutions."
    >
      {/* Page Hero Section */}
      <PageHero
        title="Our"
        titleHighlight="Partners"
        description="Strategic partnerships with industry leaders to deliver cutting-edge solutions"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Partners', isActive: true }
        ]}
      />

      {/* Partners Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Strategic Partners
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We collaborate with industry leaders to provide comprehensive technology solutions and expertise
            </p>
          </div>
          
          {partners.map((partner, index) => (
            <PartnerCard
              key={index}
              name={partner.name}
              logo={partner.logo}
              partnership={partner.partnership}
              description={partner.description}
              isLast={index === partners.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Partnership Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Why Strategic Partnerships Matter"
            subtitle="Our technology partnerships enable us to deliver cutting-edge solutions and provide comprehensive support"
            alignment="center"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {benefits.map((benefit, index) => (
              <BenefitCard
                key={index}
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Technologies We Specialize In"
            subtitle="Comprehensive expertise across our partner technology stacks"
            alignment="center"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {techStack.map((tech, index) => (
              <TechStackCard
                key={index}
                icon={tech.icon}
                title={tech.title}
                subtitle={tech.subtitle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-cover bg-center bg-no-repeat py-24"
               style={{ backgroundImage: 'url(/assets/images/bg/bg1.jpg)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/90 to-orange-200/90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <p className="text-2xl text-orange-600 mb-8 font-semibold tracking-wide">
              REACH OUT TO US
            </p>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              Ready to Start?
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-orange-700 mb-10">
              Let's build something amazing together.
            </h3>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Our partnership expertise is ready to transform your technology landscape
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <CTAButton href="/contact-us" variant="primary">
              Contact Us
            </CTAButton>
            <CTAButton href="/services" variant="secondary">
              Explore Services
            </CTAButton>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
