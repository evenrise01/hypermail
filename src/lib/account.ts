import axios from "axios";
import type {
    SyncUpdatedResponse,
    SyncResponse,
    EmailMessage
} from "./types";
import { resolve } from "path";

export class Account {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async startSync() {
    const response = await axios.post<SyncResponse>(
      "https://api.aurinko.io/v1/email/sync",
      {},
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          daysWithin: 2,
          bodyType: "html",
        },
      },
    );
    return response.data;
  }
  //Possible that either deltaToken or pageToken or both are passed
  async getUpdatedEmails({
    deltaToken,
    pageToken,
  }: {
    deltaToken?: string;
    pageToken?: string;
  }) {
    let params: Record<string, string> = {};
    if (deltaToken) params.deltaToken = deltaToken;
    if (pageToken) params.pageToken = pageToken;

    const response = await axios.get<SyncUpdatedResponse>(
      "https://api.aurinko.io/v1/email/sync/updated",
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params,
      },
    );
    return response.data;
  }

  async performInitialSync() {
    try {
      //start the sync process
      let syncResponse = await this.startSync();

      //Make sure sync response is ready in order to receive a delta token from aurinko
      while (!syncResponse.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        syncResponse = await this.startSync();
      }

      //get the delta token/bookmark from aurinko
      let storedDeltaToken: string = syncResponse.syncUpdatedToken;

      let updatedResponse = await this.getUpdatedEmails({
        deltaToken: storedDeltaToken,
      });

      if (updatedResponse.nextDeltaToken) {
        //If there is a next Delta token, means that the sync has been completed
        //Keep track of the latestDeltaToken
        storedDeltaToken = updatedResponse.nextDeltaToken;
      }

      let allEmails: EmailMessage[] = updatedResponse.records;

      //Fetch all pages within the days provided if there are more
      while (updatedResponse.nextPageToken) {
        updatedResponse = await this.getUpdatedEmails({
          pageToken: updatedResponse.nextPageToken,
        });
        allEmails = allEmails.concat(updatedResponse.records);

        if (updatedResponse.nextDeltaToken) {
          //sync has ended
          storedDeltaToken = updatedResponse.nextDeltaToken;
        }
      }
      console.log(
        "Initial sync completed, we have synced",
        allEmails.length,
        " emails",
      );

      //store the latest delta token for future incremental syncs
      //   await this.getUpdatedEmails({deltaToken:storedDeltaToken})

      return {
        emails: allEmails,
        deltaToken: storedDeltaToken,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error during sync: ",
          JSON.stringify(error.response?.data, null, 2),
        );
      } else {
        console.error("Error during sync: ", error);
      }
    }
  }
}
