/**
 * Solana Actions Example
 */

import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
  } from "@solana/actions";
  import {
    Authorized,
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    StakeProgram,
    SystemProgram,
    Transaction,
  } from "@solana/web3.js";
  
  export const GET = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
      const baseHref = new URL(
        `/api/actions/talk-with-me`,
        requestUrl.origin,
      ).toString();
  
      const payload: ActionGetResponse = {
        title: "Talk with KOL",
        icon: new URL("/solana_devs.jpg", requestUrl.origin).toString(),
        description: "Enter your email to talk with KOL",
        label: "Talk",
        links: {
          actions: [
            {
              label: "Send",
              href: `${baseHref}&email={email}`, 
              parameters: [
                {
                  name: "email", 
                  label: "Enter email", 
                  required: true,
                },
              ],
            },
          ],
        },
      };
  
      return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
    } catch (err) {
      console.log(err);
      let message = "An unknown error occurred";
      if (typeof err == "string") message = err;
      return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }
  };
  

  export const OPTIONS = GET;
  
  export const POST = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
      const { amount, toPubkey } = validatedQueryParams(requestUrl);
  
      const body: ActionPostRequest = await req.json();
  
      // validate the client provided input
      let account: PublicKey;
      try {
        account = new PublicKey(body.account);
      } catch (err) {
        return new Response('Invalid "account" provided', {
          status: 400,
          headers: ACTIONS_CORS_HEADERS,
        });
      }
  
      const connection = new Connection(
        "https://devnet.helius-rpc.com/?api-key=9a0b7796-d26e-4e8a-90f4-b5f78cbae1e5",
      );
  
      const minimumBalance = await connection.getMinimumBalanceForRentExemption(
        0, 
      );
      if (amount * LAMPORTS_PER_SOL < minimumBalance) {
        throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
      }
  
      const transaction = new Transaction();
  
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: account,
          toPubkey: toPubkey,
          lamports: amount * LAMPORTS_PER_SOL,
        }),
      );
  
      transaction.feePayer = account;
  
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
  
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: `Send ${amount} SOL to ${toPubkey.toBase58()}`,
        },
      });
  
      return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
    } catch (err) {
      console.log(err);
      let message = "An unknown error occurred";
      if (typeof err == "string") message = err;
      return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }
  };
  
  function validatedQueryParams(requestUrl: URL) {
    let toPubkey: PublicKey =  new PublicKey(
        "nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5", // devnet wallet
    );
    let amount: number = 5;
  
    try {
      if (requestUrl.searchParams.get("to")) {
        toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
      }
    } catch (err) {
      throw "Invalid input query parameter: to";
    }
  
    try {
      if (requestUrl.searchParams.get("amount")) {
        amount = parseFloat(requestUrl.searchParams.get("amount")!);
      }
  
      if (amount <= 0) throw "amount is too small";
    } catch (err) {
      throw "Invalid input query parameter: amount";
    }
  
    return {
      amount,
      toPubkey,
    };
  }
  