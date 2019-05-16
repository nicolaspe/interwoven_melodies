
gridShader = {

	uniforms: {

		"tDiffuse": { value: null },
		"grid":     { value: 30. }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform float grid;",
		"uniform vec2 tSize;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

        "void main() {",
        
            "vec2 uv = vUv * grid;",

            "uv = fract(uv);",

			"vec4 color = texture2D( tDiffuse, uv );",

			"gl_FragColor = vec4( color.rgb , 1.0 );",

		"}"

	].join( "\n" )

};
