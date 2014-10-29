module.exports = function(grunt) {
  'use strict';
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.initConfig({
    jsdoc : {
      dist : {
        src: ['./*.js'],
        options: {
          destination: 'doc'
        }
      }
    }
  });

  grunt.registerTask('docs', ['jsdoc']);
};
