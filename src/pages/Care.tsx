/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Droplets,
  Thermometer,
} from "lucide-react";

import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";

const CareItem = ({ title, icon: Icon, children }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-sm overflow-hidden bg-transparent">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition group"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-full text-accent group-hover:bg-accent group-hover:text-white transition-colors">
            <Icon size={24} />
          </div>
          <span className="font-serif text-xl text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="text-white/50" />
        ) : (
          <ChevronDown className="text-white/50" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/10 mt-2 font-light">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type BlogDoc = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  galleryImages: string[];
  isPublished: boolean;
  publishedAt?: Timestamp | null;
  tags?: string[];
};

const Care = () => {
  const [searchParams] = useSearchParams();
  const blogId = searchParams.get("blogId");
  const blogRef = useRef<HTMLDivElement>(null);

  const [blogs, setBlogs] = useState<BlogDoc[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoadingBlogs(true);
        const q = query(
          collection(db, "blogs"),
          where("isPublished", "==", true),
          orderBy("publishedAt", "desc")
        );
        const snap = await getDocs(q);
        const list: BlogDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            coverImage: data.coverImage,
            galleryImages: data.galleryImages || [],
            isPublished: data.isPublished,
            publishedAt: data.publishedAt ?? null,
            tags: data.tags || [],
          };
        });
        setBlogs(list);
      } catch (err) {
        console.error("Error loading care blogs:", err);
      } finally {
        setLoadingBlogs(false);
      }
    };

    void loadBlogs();
  }, []);

  useEffect(() => {
    if (blogId && blogRef.current) {
      setTimeout(() => {
        blogRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [blogId]);

  const activeBlog = blogId
    ? blogs.find((b) => b.id === blogId) || null
    : null;

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return "";
    return ts.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black pt-40 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-serif font-medium text-white mb-6">
            Your Guide to Plant Care
          </h1>
        </div>

        <div className="space-y-6 mb-24">
          <CareItem title="Light Requirements" icon={Sun}>
            <p>
              Understanding light is crucial. Most indoor plants prefer
              "bright, indirect light," which means they cast a shadow but
              aren't in the direct beam of the sun. South-facing windows offer
              the most intese light, while north-facing ones are gentler. If
              your plant is reaching towards the light, move it closer to a
              window.
            </p>
          </CareItem>

          <CareItem title="Watering Basics" icon={Droplets}>
            <p>
              Overwatering is the #1 killer of houseplants! Always check the
              soil before adding water. Stick your finger about an inch deep
              into the soil; if it feels dry, it's time to water. Ensuring your
              pot has drainage holes is non-negotiable to prevent root rot.
            </p>
          </CareItem>

          <CareItem title="Temperature & Humidity" icon={Thermometer}>
            <p>
              Most tropical plants thrive in temperatures between 65°F and 80°F
              (18°C - 26°C). Avoid placing them near cold drafts (like AC vents)
              or heat sources (radiators). Many plants also love humidity! Mist
              them occasionally or place them on a pebble tray with water.
            </p>
          </CareItem>
        </div>

        {/* Blog Rendering Section */}
        <AnimatePresence>
          {activeBlog && (
            <motion.div
              ref={blogRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
              className="border-t border-white/20 pt-20 mb-24"
            >
              <span className="text-accent text-sm font-bold tracking-widest uppercase mb-4 block">
                {formatDate(activeBlog.publishedAt)}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-white mb-8">
                {activeBlog.title}
              </h2>
              <div className="w-full aspect-video overflow-hidden rounded-sm mb-10 bg-gray-800">
                <img
                  src={activeBlog.coverImage}
                  alt={activeBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* main content: use excerpt + content */}
              <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-light">
                {activeBlog.excerpt && (
                  <p className="mb-6">{activeBlog.excerpt}</p>
                )}
                {activeBlog.content && (
                  <p className="mb-6 whitespace-pre-line">
                    {activeBlog.content}
                  </p>
                )}

                {activeBlog.galleryImages &&
                  activeBlog.galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {activeBlog.galleryImages.slice(0, 6).map((src, i) => (
                        <div
                          key={i}
                          className="relative aspect-square overflow-hidden rounded-sm bg-gray-800"
                        >
                          <img
                            src={src}
                            alt={`Gallery ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 text-center">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-white hover:text-accent transition-colors text-sm tracking-widest uppercase"
                >
                  Back to Top
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Articles Section */}
        <div className="border-t border-white/20 pt-20">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-12 text-center">
            Plant Care Articles
          </h2>

          {loadingBlogs ? (
            <div className="text-center text-gray-500 py-10">
              Loading articles...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {blogs.map((post) => (
                <Link
                  to={`/care?blogId=${post.id}`}
                  key={post.id}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-800 mb-6">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-accent text-xs font-bold tracking-widest uppercase mb-2">
                      {formatDate(post.publishedAt)}
                    </span>
                    <h3 className="text-2xl font-serif text-white mb-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    {/* Excerpt below title */}
                    {post.excerpt && (
                      <p className="text-white/70 text-sm mb-3 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="text-white/60 text-sm tracking-widest uppercase group-hover:text-white transition-colors">
                      Read Article
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Care;
