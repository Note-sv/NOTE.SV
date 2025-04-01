
  Pod::Spec.new do |s|
    s.name = 'NoteNode'
    s.version = '0.0.1'
    s.summary = 'Node Plugin Note'
    s.license = 'MIT'
    s.homepage = 'https://github.com/chainbow/note-node.git'
    s.author = 'suhao'
    s.source = { :git => 'https://github.com/chainbow/note-node.git', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
  end