export const auth = (req, res, next) => {
  let cookie = req.signedCookies.cookieAmoratto
  
if(!cookie || cookie === undefined){
    res.redirect('/?msg=Sesion expirada')
}

  if (cookie !== 'true') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Error en proceso de logueo' });
  }
  next();
}
