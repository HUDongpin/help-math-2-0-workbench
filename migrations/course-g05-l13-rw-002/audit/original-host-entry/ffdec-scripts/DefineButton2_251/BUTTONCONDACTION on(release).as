on(release){
   STHelpURL = _root.dtfSTUDENT_HELP_URL.text;
   _root.popup.gotoAndStop(1);
   _global.Pause = true;
   _global.Play = false;
   _root.animation_mc.animation.stop();
   ss = new Sound();
   ss.setVolume(0);
   _root.animation_mc.animation.Mc_Feed1.stop();
   _root.animation_mc.animation.Mc_Feed2.stop();
   _root.animation_mc.animation.Mc_Feed3.stop();
   _root.animation_mc.animation.Mc_Feed4.stop();
   _root.pause_mc._visible = false;
   _root.play_mc._visible = true;
   _root.glossary._visible = false;
   _root.calculator._visible = false;
   _root.m_c._visible = false;
   getURL("javascript:void(window.open(\'" + STHelpURL + "\'));","");
}
