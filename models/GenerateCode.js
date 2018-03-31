//Generate a random 6 digit alpha-numeric code
class GenerateCode{
    static getId(){
        let idLength = 6
        let chars="0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z";
        chars=chars.split(",");
        let min=0;
        let max=chars.length-1;
        let id="";
        for(let i=0; i<idLength;i++)
        {
                id+=chars[ Math.floor(Math.random()*(max - min + 1) + min) ];
        }
        return id;
    }
}

module.exports = GenerateCode