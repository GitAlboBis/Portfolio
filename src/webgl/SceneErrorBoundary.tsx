"use client";

import { Component, type ReactNode } from "react";

/*
  Catches render errors from the 3D hero subtree — most importantly a failed GLB
  fetch/parse (drei's useGLTF re-throws synchronously on rejection, and our
  useGeometry() throws if the mesh is missing). A synchronous render throw is NOT
  catchable by <Suspense> (which only intercepts promises), so without this the
  error would propagate to the root layout and white-screen the whole single-page
  site. On error we render nothing: the always-present CSS sea gradient + DOM hero
  remain — the documented graceful degrade (CLAUDE.md "degrado elegante").
*/
type Props = { children: ReactNode; fallback?: ReactNode; onError?: () => void };
type State = { hasError: boolean };

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[hero] 3D scene failed; falling back to static backdrop:", error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
