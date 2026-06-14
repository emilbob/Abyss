import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/**
 * Postprocessing — bloom makes the sparse bioluminescence read as glow against
 * the void; a heavy vignette closes the world down into instrument-scope
 * darkness; faint noise gives the water grain / sensor texture.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.5}
        luminanceSmoothing={0.08}
        intensity={1.4}
        mipmapBlur
        radius={0.82}
      />
      <Vignette offset={0.18} darkness={0.82} blendFunction={BlendFunction.NORMAL} />
      <Noise opacity={0.04} blendFunction={BlendFunction.ADD} />
    </EffectComposer>
  )
}
