
bandShader = {

	uniforms: {

		"tDiffuse": { value: null },
		"centers":  { value: new THREE.Vector3(0.1, 0.3, 0.7) },

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform vec3 centers;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

        "void main() {",

            "vec4 color = texture2D( tDiffuse, vUv );",
            
            "vec2 barR1 = vec2(1) - smoothstep(vec2(centers.x+0.05, 0), vec2(centers.x+0.1, 0), vUv);",
            "vec2 barL1 = smoothstep(vec2(centers.x-0.1, 0), vec2(centers.x-0.05, 0), vUv);",
            "float bar1 = barR1.x * barL1.x;",

            "vec2 barR2 = vec2(1) - smoothstep(vec2(centers.y+0.05, 0), vec2(centers.y+0.1, 0), vUv);",
            "vec2 barL2 = smoothstep(vec2(centers.y-0.1, 0), vec2(centers.y-0.05, 0), vUv);",
            "float bar2 = barR2.x * barL2.x;",

            "vec2 barR3 = vec2(1) - smoothstep(vec2(centers.z+0.05, 0), vec2(centers.z+0.1, 0), vUv);",
            "vec2 barL3 = smoothstep(vec2(centers.z-0.1, 0), vec2(centers.z-0.05, 0), vUv);",
            "float bar3 = barR3.x * barL3.x;",

            "float bar = bar1 + bar2 + bar3;",

			"gl_FragColor = vec4( color.rgb , bar1 );",

		"}"

	].join( "\n" )

};

