import { GITHUB_LOGIN_URL } from "../lib/api";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-[#3ECF8E] text-2xl">{"</>"}</span>
          <span className="text-white font-bold text-xl">DevTrack</span>
        </div>
        <p className="text-[#8A8F99] text-sm mb-8">
          Track your GitHub activity, honestly.
        </p>
        <a
          href={GITHUB_LOGIN_URL}
          className="inline-flex items-center gap-2 bg-[#F2F1ED] text-[#05070A] font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white transition"
        >
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
