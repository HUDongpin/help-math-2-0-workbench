if(loadBar._width == getPercent * 100 && Math.round(getPercent * 100) >= 100 && _root.animation_mc.getBytesLoaded() >= _root.animation_mc.getBytesTotal())
{
   _global.showWarnText = 0;
   _root.WarnText = "";
   this.gotoAndStop(1);
   _root.animation_mc.gotoAndPlay("begin");
}
else
{
   _root.WarnText = "Loading page. Please wait...";
   play();
}
