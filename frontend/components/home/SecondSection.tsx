"use client";

import { features, fetureType } from "@/data/feature";
import { ArrowUpRight } from "lucide-react";

function FeatureCard({ Icon, title, description, index }: fetureType & { index: number }) {
    return (
        <div
            className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-cyan-400" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                {title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
                {description}
            </p>

            {/* Hover arrow */}
            <ArrowUpRight className="absolute top-6 right-6 w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}

export default function SecondSection() {
    return (
        <section id="features" className="relative py-24 md:py-32">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
                        Features
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Why choose{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Drawli
                        </span>
                        ?
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Everything you need to bring your ideas to life, with the simplicity and power you deserve.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={feature.title}
                            Icon={feature.Icon}
                            title={feature.title}
                            description={feature.description}
                            index={index}
                        />
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-20 text-center">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
                        <p className="text-lg text-gray-300">
                            Ready to start creating?
                        </p>
                        <a
                            href="/draw"
                            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                        >
                            Try Drawli Free
                            <ArrowUpRight className="ml-2 w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}