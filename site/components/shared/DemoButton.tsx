"use client";

import { ArrowRight } from "lucide-react";

import { useAppDispatch } from "@/store/hooks";
import { openDemoModal } from "@/store/slices/uiSlice";

export function DemoButton({
  label = "Demo Talep Et",
  className = "btn btn-primary",
}: {
  label?: string;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  return (
    <button className={className} onClick={() => dispatch(openDemoModal())}>
      {label} <ArrowRight size={17} />
    </button>
  );
}
