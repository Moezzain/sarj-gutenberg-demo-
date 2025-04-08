import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1>Hello World</h1>
      <Button>Click me</Button>
    </div>
  );
}
