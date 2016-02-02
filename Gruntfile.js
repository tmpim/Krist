module.exports = function(grunt) {
	grunt.initConfig({
		apidoc: {
			krist2node: {
				src: "src/",
				dest: "static/docs/"
			}
		},
		watch: {
			files: ['src/**/*.js'],
			tasks: ['apidoc']
		}
	});

	grunt.loadNpmTasks('grunt-apidoc');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['watch']);
};