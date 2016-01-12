del C:\Users\a.belevich\.hawtio /F /Q
rmdir C:\Users\a.belevich\.hawtio /S /Q
del C:\work\tools\hawt.io\run\plugins\*.* /Q

pushd C:\work\tools\hawt.io\fork\hawtio\hawtio-plugin-examples\eureka-client-plugin
call mvn clean install 
popd

copy C:\work\tools\hawt.io\fork\hawtio\hawtio-plugin-examples\eureka-client-plugin\target\eureka-client-plugin-1.4.59.war C:\work\tools\hawt.io\run\plugins\eureka-client-plugin.war
java -jar hawtio-app-1.4.59-my.jar