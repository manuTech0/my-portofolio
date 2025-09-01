import type { LegacyAnimationControls, TargetAndTransition, Transition, VariantLabels } from "framer-motion";

export interface componentsRef {
    homeRef: React.RefObject<HTMLElement | null>;
    aboutRef: React.RefObject<HTMLElement | null>;
    projectsRef: React.RefObject<HTMLElement | null>;
    contactRef: React.RefObject<HTMLElement | null>;
}

export interface motionConfig {
    initial: TargetAndTransition | VariantLabels,
    animate: TargetAndTransition | VariantLabels | LegacyAnimationControls,
    transitions: Transition,

}