// Native links and disclosures work without JavaScript. Keep one device guide open.
document.querySelectorAll('.device-steps details').forEach(detail=>{
  detail.addEventListener('toggle',()=>{
    if(detail.open)document.querySelectorAll('.device-steps details').forEach(other=>{if(other!==detail)other.open=false;});
  });
});
